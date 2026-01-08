import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { Lobby } from '@/lib/db/models/Lobby';
import { LobbyParticipant } from '@/lib/db/models/LobbyParticipant';
import { PriceSnapshot } from '@/lib/db/models/PriceSnapshot';
import { roundPriceToPrecision } from '@/lib/utils/pricePrecision';

// POST - Automatically take snapshot based on lobby status
// This should be called periodically or when lobby status changes
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

    const now = new Date();
    const startTime = new Date(lobby.startTime);
    // Calculate end time: startTime + interval (in seconds)
    const endTime = new Date(startTime.getTime() + lobby.interval * 1000);

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

    // Fetch current prices from Binance
    const allCryptoIds = new Set<string>();
    const participants = await LobbyParticipant.find({ lobbyId: lobby._id });
    
    participants.forEach((p) => {
      p.team.cryptos.forEach((cryptoId) => allCryptoIds.add(cryptoId));
    });

    const currentPrices: { cryptoId: string; price: number }[] = [];

    for (const cryptoId of Array.from(allCryptoIds)) {
      const binanceSymbol = CRYPTO_SYMBOL_MAP[cryptoId];
      if (!binanceSymbol) continue;

      try {
        const response = await fetch(
          `https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`
        );
        if (!response.ok) continue;

        const data = await response.json();
        // Parse price and round to 8 decimal places for precision
        const price = roundPriceToPrecision(data.price);
        currentPrices.push({
          cryptoId,
          price,
        });
      } catch (error) {
        console.error(`Error fetching price for ${cryptoId}:`, error);
      }
    }

    if (currentPrices.length === 0) {
      return NextResponse.json(
        { error: 'Failed to fetch current prices' },
        { status: 500 }
      );
    }

    let snapshotType: 'start' | 'end' | null = null;
    let action = '';

    // Check if lobby just started (within last 30 seconds)
    if (now >= startTime && now <= new Date(startTime.getTime() + 30000)) {
      // Check if start snapshot already exists
      const existingStart = await PriceSnapshot.findOne({
        lobbyId: lobby._id,
        snapshotType: 'start',
      });

      if (!existingStart) {
        snapshotType = 'start';
        action = 'start';
      }
    }

    // Check if lobby just ended (within last 30 seconds)
    if (now >= endTime && now <= new Date(endTime.getTime() + 30000)) {
      // Check if end snapshot already exists
      const existingEnd = await PriceSnapshot.findOne({
        lobbyId: lobby._id,
        snapshotType: 'end',
      });

      if (!existingEnd) {
        snapshotType = 'end';
        action = 'end';
      }
    }

    if (!snapshotType) {
      return NextResponse.json({
        message: 'No snapshot needed at this time',
        lobbyStatus: {
          now: now.toISOString(),
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          hasStartSnapshot: !!(await PriceSnapshot.findOne({ lobbyId: lobby._id, snapshotType: 'start' })),
          hasEndSnapshot: !!(await PriceSnapshot.findOne({ lobbyId: lobby._id, snapshotType: 'end' })),
        },
      });
    }

    // Create snapshots for all participants
    const snapshots = [];
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

      // Remove existing snapshot of this type
      await PriceSnapshot.deleteOne({
        lobbyId: lobby._id,
        participantId: participant._id,
        snapshotType,
      });

      // Create new snapshot
      const snapshot = await PriceSnapshot.create({
        lobbyId: lobby._id,
        participantId: participant._id,
        address: participant.address,
        snapshotType,
        prices: participantPrices,
        timestamp: new Date(),
      });

      snapshots.push(snapshot);
    }

    console.log(`✅ Auto-created ${snapshots.length} ${snapshotType} snapshots for lobby ${lobbyId}`);

    return NextResponse.json({
      success: true,
      action,
      snapshotType,
      count: snapshots.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in auto-snapshot:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


