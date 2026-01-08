import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { Lobby } from '@/lib/db/models/Lobby';
import { LobbyParticipant } from '@/lib/db/models/LobbyParticipant';
import { PriceSnapshot } from '@/lib/db/models/PriceSnapshot';
import { roundPriceToPrecision } from '@/lib/utils/pricePrecision';

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

    // Fetch current prices from Binance API
    const cryptoSymbols = Array.from(allCryptoIds);
    const currentPrices: { cryptoId: string; price: number }[] = [];

    // Map crypto IDs to Binance symbols
    const CRYPTO_SYMBOL_MAP: Record<string, string> = {
      btc: 'BTCUSDT',
      eth: 'ETHUSDT',
      bnb: 'BNBUSDT',
      sol: 'SOLUSDT',
      ada: 'ADAUSDT',
      xrp: 'XRPUSDT',
      dot: 'DOTUSDT',
      matic: 'MATICUSDT',
      avax: 'AVAXUSDT',
      link: 'LINKUSDT',
      ltc: 'LTCUSDT',
      atom: 'ATOMUSDT',
      algo: 'ALGOUSDT',
      vet: 'VETUSDT',
      icp: 'ICPUSDT',
    };

    // Fetch prices from Binance API
    for (const cryptoId of cryptoSymbols) {
      const binanceSymbol = CRYPTO_SYMBOL_MAP[cryptoId];
      if (!binanceSymbol) {
        console.warn(`No Binance symbol found for ${cryptoId}`);
        continue;
      }

      try {
        const response = await fetch(
          `https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`
        );
        if (!response.ok) throw new Error(`Failed to fetch ${binanceSymbol}`);

        const data = await response.json();
        // Parse price and round to 8 decimal places for precision
        const price = roundPriceToPrecision(data.price);
        currentPrices.push({
          cryptoId,
          price,
        });
      } catch (error) {
        console.error(`Error fetching price for ${cryptoId}:`, error);
        // Continue with other cryptos
      }
    }

    if (currentPrices.length === 0) {
      return NextResponse.json(
        { error: 'Failed to fetch current prices' },
        { status: 500 }
      );
    }

    // Get start snapshots
    const startSnapshots = await PriceSnapshot.find({
      lobbyId: lobby._id,
      snapshotType: 'start',
    }).lean();

    if (startSnapshots.length === 0) {
      return NextResponse.json(
        { error: 'Start snapshot not found. Please take a start snapshot first.' },
        { status: 400 }
      );
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
        { upsert: true, new: true }
      );
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

