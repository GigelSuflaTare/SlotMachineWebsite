import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import robuImg from '@/assets/robu.png';

type Symbol = { type: 'emoji'; value: string } | { type: 'image'; src: string; alt: string };

const SYMBOLS: Symbol[] = [
  { type: 'emoji', value: '🍎' },
  { type: 'emoji', value: '🍊' },
  { type: 'emoji', value: '🍋' },
  { type: 'emoji', value: '🔔' },
  { type: 'emoji', value: '⭐' },
  { type: 'emoji', value: '💎' },
  { type: 'image', src: robuImg, alt: 'Robu' },
];
const SPIN_COST = 10;
const ROW_WIN_PRIZE = 50;
const ROBU_PRIZE = 100;
const COLS = 5;
const ROWS = 3;

const getSymbolKey = (s: Symbol): string => s.type === 'emoji' ? s.value : s.src;

const generateGrid = (randomFn: () => Symbol): Symbol[][] => 
  Array.from({ length: ROWS }, () => Array.from({ length: COLS }, randomFn));

export const SlotMachine = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(100);
  const [grid, setGrid] = useState<Symbol[][]>(generateGrid(() => SYMBOLS[0]));
  const [spinning, setSpinning] = useState(false);
  const [message, setMessage] = useState("Click SPIN to play!");
  const [loading, setLoading] = useState(true);

  const randomSymbol = (): Symbol => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];

  const fetchBalance = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('user_balances')
      .select('balance')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching balance:', error);
      // Try to create balance record if not exists
      const { error: insertError } = await supabase
        .from('user_balances')
        .insert({ user_id: user.id, balance: 100 });
      
      if (!insertError) {
        setBalance(100);
      }
    } else if (data) {
      setBalance(data.balance);
    } else {
      // Create balance record
      await supabase
        .from('user_balances')
        .insert({ user_id: user.id, balance: 100 });
      setBalance(100);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const updateBalance = async (newBalance: number) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('user_balances')
      .update({ balance: newBalance })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating balance:', error);
      toast({
        title: "Error",
        description: "Failed to update balance",
        variant: "destructive"
      });
    }
  };

  const isRobu = (s: Symbol): boolean => s.type === 'image';
  
  const evaluateWin = (finalGrid: Symbol[][]): { prize: number; message: string } => {
    let totalPrize = 0;
    let hasRobu = false;
    
    // Check for Robu anywhere
    for (const row of finalGrid) {
      for (const symbol of row) {
        if (isRobu(symbol)) hasRobu = true;
      }
    }
    
    if (hasRobu) {
      return { prize: ROBU_PRIZE, message: `🎉 ROBU BONUS! You won $${ROBU_PRIZE}!` };
    }
    
    // Check each row for matching symbols
    for (const row of finalGrid) {
      const keys = row.map(getSymbolKey);
      if (keys.every(k => k === keys[0])) {
        totalPrize += ROW_WIN_PRIZE;
      }
    }
    
    if (totalPrize > 0) {
      return { prize: totalPrize, message: `✨ Row match! You won $${totalPrize}!` };
    }
    
    return { prize: 0, message: "No match. Try again!" };
  };

  const spin = async () => {
    if (balance < SPIN_COST) {
      setMessage("Not enough money! Game Over!");
      return;
    }

    setSpinning(true);
    const newBalance = balance - SPIN_COST;
    setBalance(newBalance);
    setMessage("Spinning...");

    let ticks = 0;
    const interval = setInterval(() => {
      setGrid(generateGrid(randomSymbol));
      ticks++;

      if (ticks > 15) {
        clearInterval(interval);
        const finalGrid = generateGrid(randomSymbol);
        setGrid(finalGrid);
        
        const { prize, message } = evaluateWin(finalGrid);
        const finalBalance = newBalance + prize;
        setBalance(finalBalance);
        setMessage(message);
        updateBalance(finalBalance);
        setSpinning(false);
      }
    }, 100);
  };

  if (loading) {
    return (
      <Card className="bg-background/40 backdrop-blur-lg border-border/50">
        <CardContent className="p-8 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-background/40 backdrop-blur-lg border-border/50">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
          🎰 Slot Machine
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Balance Display */}
        <div className="text-center">
          <span className="text-lg font-semibold text-muted-foreground">Balance: </span>
          <span className="text-2xl font-bold text-primary">${balance}</span>
        </div>

        {/* Grid */}
        <div className="flex flex-col items-center gap-2">
          {grid.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-2">
              {row.map((symbol, colIndex) => (
                <div
                  key={colIndex}
                  className={`w-14 h-14 flex items-center justify-center text-3xl bg-background/60 rounded-lg border-2 border-primary/30 shadow-lg ${
                    spinning ? 'animate-pulse' : ''
                  }`}
                >
                  {symbol.type === 'emoji' ? (
                    symbol.value
                  ) : (
                    <img src={symbol.src} alt={symbol.alt} className="w-10 h-10 object-cover rounded" />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Message */}
        <p className="text-center text-lg font-medium min-h-[28px]">
          {message}
        </p>

        {/* Spin Button */}
        <div className="flex justify-center">
          <Button
            onClick={spin}
            disabled={spinning || balance < SPIN_COST}
            size="lg"
            className="px-12 py-6 text-xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg"
          >
            {spinning ? "SPINNING..." : `SPIN ($${SPIN_COST})`}
          </Button>
        </div>

        {/* Info */}
        <div className="text-center text-sm text-muted-foreground space-y-1">
          <p><img src={robuImg} alt="Robu" className="inline w-5 h-5 rounded" /> = $100 Bonus!</p>
          <p>Full row match = $50</p>
        </div>
      </CardContent>
    </Card>
  );
};
