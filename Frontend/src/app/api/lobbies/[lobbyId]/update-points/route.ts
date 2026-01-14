import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { Lobby } from '@/lib/db/models/Lobby';
import { LobbyParticipant } from '@/lib/db/models/LobbyParticipant';
import { PriceSnapshot } from '@/lib/db/models/PriceSnapshot';
import { roundPriceToPrecision } from '@/lib/utils/pricePrecision';
import { calculateLobbyStatus } from '@/lib/utils/lobbyStatus';
import { LobbyParticipant as LobbyParticipantModel } from '@/lib/db/models/LobbyParticipant';
import { fetchCryptoPrices } from '@/lib/utils/priceFetcher';

// POST - Update points using current prices from Binance API
// This endpoint fetches current prices and calculates points
export async function POST(
  request: NextRequest,
  { params }: { params: { lobbyId: string } }
) {
  try {
    await connectDB();

    const { lobbyId } = params;

    if (!lobbyId || lobbyId.length !== 24) {
      return NextResponse.json(
        { error: 'Invalid lobby ID' },
        { status: 400 }
      );
    }

    // Get lobby
    const lobby = await Lobby.findById(lobbyId);
    if (!lobby) {
      return NextResponse.json(
        { error: 'Lobby not found' },
        { status: 404 }
      );
    }

    // Check if lobby has ended - if so, use end snapshot prices instead
    const participantCount = await LobbyParticipantModel.countDocuments({
      lobbyId: lobby._id,
    });
    
    const currentStatus = calculateLobbyStatus(
      lobby.startTime,
      lobby.interval,
      participantCount,
      lobby.maxParticipants,
      lobby.status
    );

    // If lobby has ended, use end snapshot prices (final leaderboard)
    if (currentStatus === 'ended' || currentStatus === 'closed') {
      // Get end snapshots
      const endSnapshots = await PriceSnapshot.find({
        lobbyId: lobby._id,
        snapshotType: 'end',
      }).lean();

      if (endSnapshots.length === 0) {
        // If no end snapshot, try to use the last current snapshot
        const lastSnapshots = await PriceSnapshot.find({
          lobbyId: lobby._id,
          snapshotType: 'current',
        })
          .sort({ timestamp: -1 })
          .limit(1)
          .lean();

        if (lastSnapshots.length === 0) {
          return NextResponse.json(
            { error: 'Lobby has ended but no final snapshot found', ended: true },
            { status: 400 }
          );
        }
      }

      // Return early - points should not be updated after lobby ends
      return NextResponse.json({
        success: true,
        message: 'Lobby has ended. Final leaderboard is locked.',
        ended: true,
        timestamp: new Date().toISOString(),
      });
    }

    // Get all participants
    const participants = await LobbyParticipant.find({
      lobbyId: lobby._id,
    });

    if (participants.length === 0) {
      return NextResponse.json(
        { message: 'No participants to update' },
        { status: 200 }
      );
    }

    // Get all unique crypto IDs from all participants
    const allCryptoIds = new Set<string>();
    participants.forEach((p) => {
      p.team.cryptos.forEach((cryptoId) => allCryptoIds.add(cryptoId));
    });

    // Fetch current prices using the centralized utility with retry logic
    const cryptoSymbols = Array.from(allCryptoIds);
    console.log(`Fetching prices for ${cryptoSymbols.length} cryptos:`, cryptoSymbols);
    
    const priceData = await fetchCryptoPrices(cryptoSymbols, {
      retries: 3,
      retryDelay: 1000,
      timeout: 8000, // Increased timeout for Vercel
    });

    if (priceData.length === 0) {
      console.error('Failed to fetch any prices from Binance API');
      return NextResponse.json(
        { error: 'Failed to fetch current prices. Please try again later.' },
        { status: 500 }
      );
    }

    // Warn if some prices are missing
    if (priceData.length < cryptoSymbols.length) {
      const fetchedIds = new Set(priceData.map(p => p.cryptoId));
      const missing = cryptoSymbols.filter(id => !fetchedIds.has(id));
      console.warn(`Missing prices for: ${missing.join(', ')}`);
    }

    const currentPrices = priceData.map(p => ({
      cryptoId: p.cryptoId,
      price: p.price,
    }));

    // Get start snapshots
    let startSnapshots = await PriceSnapshot.find({
      lobbyId: lobby._id,
      snapshotType: 'start',
    }).lean();

    // If no start snapshot exists and lobby has started, create one now
    if (startSnapshots.length === 0) {
      const now = new Date();
      const startTime = new Date(lobby.startTime);
      const endTime = new Date(startTime.getTime() + lobby.interval * 1000);

      // Only create start snapshot if lobby has started but not ended
      if (now >= startTime && now < endTime) {
        console.log(`No start snapshot found for lobby ${lobbyId}, creating one now...`);
        
        try {
          // Create snapshots for all participants with current prices
          for (const participant of participants) {
            const participantPrices = participant.team.cryptos.map((cryptoId) => {
              const priceData = currentPrices.find((p) => p.cryptoId === cryptoId);
              const price = priceData?.price ? roundPriceToPrecision(priceData.price) : 0;
              return {
                cryptoId,
                price,
                isCaptain: participant.team.captain === cryptoId,
                isViceCaptain: participant.team.viceCaptain === cryptoId,
              };
            });

            await PriceSnapshot.findOneAndUpdate(
              {
                lobbyId: lobby._id,
                participantId: participant._id,
                snapshotType: 'start',
              },
              {
                lobbyId: lobby._id,
                participantId: participant._id,
                address: participant.address,
                snapshotType: 'start',
                prices: participantPrices,
                timestamp: new Date(),
              },
              { upsert: true, new: true, setDefaultsOnInsert: true }
            );
          }

          // Re-fetch the start snapshots
          startSnapshots = await PriceSnapshot.find({
            lobbyId: lobby._id,
            snapshotType: 'start',
          }).lean();

          console.log(`Created ${startSnapshots.length} start snapshots`);
        } catch (error) {
          console.error('Error creating start snapshots:', error);
        }
      }
      
      // If still no snapshots, return error
      if (startSnapshots.length === 0) {
        return NextResponse.json(
          { error: 'Start snapshot not found and could not be created. Lobby may have ended.' },
          { status: 400 }
        );
      }
    }

    // Create a map of start prices by participant
    const startPriceMap = new Map();
    startSnapshots.forEach((snapshot) => {
      startPriceMap.set(snapshot.participantId.toString(), snapshot.prices);
    });

    // Calculate and update points for each participant
    const updatedParticipants = [];
    for (const participant of participants) {
      const startPrices = startPriceMap.get(participant._id.toString());
      if (!startPrices || startPrices.length === 0) {
        continue;
      }

      let totalPoints = 0;

      // Calculate points for each crypto
      for (const startPrice of startPrices) {
        const currentPriceData = currentPrices.find(
          (p) => p.cryptoId === startPrice.cryptoId
        );

        if (!currentPriceData) {
          continue;
        }

        const startPriceValue = startPrice.price;
        const currentPriceValue = currentPriceData.price;

        if (startPriceValue === 0) {
          continue;
        }

        // Calculate percentage change
        const percentageChange = ((currentPriceValue - startPriceValue) / startPriceValue) * 100;
        const roundedChange = Math.round(percentageChange * 100) / 100;

        // Apply multipliers
        let points = roundedChange;
        if (startPrice.isCaptain) {
          points = roundedChange * 2;
        } else if (startPrice.isViceCaptain) {
          points = roundedChange * 1.5;
        }

        points = Math.round(points * 100) / 100;
        totalPoints += points;
      }

      totalPoints = Math.round(totalPoints * 100) / 100;

      // Update participant
      participant.points = totalPoints;
      await participant.save();

      updatedParticipants.push({
        id: participant._id.toString(),
        address: participant.address,
        points: totalPoints,
      });
    }

    // Update ranks
    const sortedParticipants = await LobbyParticipant.find({
      lobbyId: lobby._id,
    })
      .sort({ points: -1, joinedAt: 1 })
      .lean();

    for (let i = 0; i < sortedParticipants.length; i++) {
      await LobbyParticipant.updateOne(
        { _id: sortedParticipants[i]._id },
        { rank: i + 1 }
      );
    }

    // Save current snapshot for reference
    for (const participant of participants) {
      const participantPrices = participant.team.cryptos.map((cryptoId) => {
        const priceData = currentPrices.find((p) => p.cryptoId === cryptoId);
        // Ensure price is properly rounded to 8 decimal places
        const price = priceData?.price ? roundPriceToPrecision(priceData.price) : 0;
        return {
          cryptoId,
          price,
          isCaptain: participant.team.captain === cryptoId,
          isViceCaptain: participant.team.viceCaptain === cryptoId,
        };
      });

      try {
        await PriceSnapshot.findOneAndUpdate(
          {
            lobbyId: lobby._id,
            participantId: participant._id,
            snapshotType: 'current',
          },
          {
            lobbyId: lobby._id,
            participantId: participant._id,
            address: participant.address,
            snapshotType: 'current',
            prices: participantPrices,
            timestamp: new Date(),
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      } catch (error: any) {
        // Handle duplicate key error (race condition)
        if (error.code !== 11000) {
          throw error;
        }
      }
    }

    return NextResponse.json({
      success: true,
      updated: updatedParticipants.length,
      participants: updatedParticipants,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating points:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

