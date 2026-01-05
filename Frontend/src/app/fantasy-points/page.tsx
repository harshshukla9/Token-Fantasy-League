'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { ChevronDown, ChevronUp, Trophy, Crown, Star, TrendingUp, TrendingDown, Calculator, Info, ArrowUp, ArrowDown, X, Check, Play, RotateCcw, ArrowRight, Equal, Percent } from 'lucide-react';

interface PointRule {
  title: string;
  description: string;
  points: string;
  example?: string;
  isNew?: boolean;
}

interface CollapsibleSection {
  title: string;
  icon?: React.ReactNode;
  content: PointRule[];
}

export default function FantasyPointsPage() {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'important': true,
    'batting': false,
    'bowling': false,
    'fielding': false,
    'additional': false,
    'other': false,
  });
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedExample, setSelectedExample] = useState<'regular' | 'captain' | 'viceCaptain' | 'negative'>('regular');

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Example data for step-by-step calculation animation
  const stepByStepExamples = {
    regular: {
      token: 'ETH',
      basePrice: 2977.80,
      currentPrice: 3006.58,
      role: 'Regular',
      multiplier: 1,
      icon: Trophy,
      color: 'white'
    },
    captain: {
      token: 'BTC',
      basePrice: 88150,
      currentPrice: 89050,
      role: 'Captain',
      multiplier: 2,
      icon: Crown,
      color: 'yellow'
    },
    viceCaptain: {
      token: 'SOL',
      basePrice: 126.10,
      currentPrice: 127.36,
      role: 'Vice-Captain',
      multiplier: 1.5,
      icon: Star,
      color: 'gray'
    },
    negative: {
      token: 'BNB',
      basePrice: 851.85,
      currentPrice: 842.33,
      role: 'Regular',
      multiplier: 1,
      icon: Trophy,
      color: 'white'
    }
  };

  const example = stepByStepExamples[selectedExample];
  const priceChange = example.currentPrice - example.basePrice;
  const percentageChange = ((priceChange / example.basePrice) * 100);
  const basePoints = percentageChange;
  const finalPoints = basePoints * example.multiplier;

  const steps = [
    {
      title: 'Step 1: Base Value Recorded',
      description: `When ${example.token} was added to your team`,
      value: `$${example.basePrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
      formula: 'Base Value = Entry Price',
      show: currentStep >= 0
    },
    {
      title: 'Step 2: Current Price',
      description: `Current market price of ${example.token}`,
      value: `$${example.currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
      formula: 'Current Price = Market Value',
      show: currentStep >= 1
    },
    {
      title: 'Step 3: Calculate Price Change',
      description: 'Difference between current and base price',
      value: `${priceChange >= 0 ? '+' : ''}$${priceChange.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
      formula: `$${example.currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })} - $${example.basePrice.toLocaleString(undefined, { maximumFractionDigits: 2 })} = ${priceChange >= 0 ? '+' : ''}$${Math.abs(priceChange).toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
      show: currentStep >= 2
    },
    {
      title: 'Step 4: Calculate Percentage Change',
      description: 'Percentage change from base value',
      value: `${percentageChange >= 0 ? '+' : ''}${percentageChange.toFixed(2)}%`,
      formula: `(${priceChange >= 0 ? '+' : ''}$${Math.abs(priceChange).toLocaleString(undefined, { maximumFractionDigits: 2 })} / $${example.basePrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}) × 100 = ${percentageChange >= 0 ? '+' : ''}${percentageChange.toFixed(2)}%`,
      show: currentStep >= 3
    },
    {
      title: 'Step 5: Base Points',
      description: '1% change = 1 point',
      value: `${basePoints >= 0 ? '+' : ''}${basePoints.toFixed(2)} pts`,
      formula: `${percentageChange >= 0 ? '+' : ''}${percentageChange.toFixed(2)}% = ${basePoints >= 0 ? '+' : ''}${basePoints.toFixed(2)} points`,
      show: currentStep >= 4
    },
    {
      title: example.role !== 'Regular' ? `Step 6: Apply ${example.role} Multiplier` : 'Step 6: No Multiplier',
      description: example.role !== 'Regular' ? `${example.role} gets ${example.multiplier}× multiplier` : 'Regular tokens have no multiplier',
      value: `${example.multiplier}×`,
      formula: example.role !== 'Regular' 
        ? `${basePoints >= 0 ? '+' : ''}${basePoints.toFixed(2)} × ${example.multiplier} = ${finalPoints >= 0 ? '+' : ''}${finalPoints.toFixed(2)} points`
        : `${basePoints >= 0 ? '+' : ''}${basePoints.toFixed(2)} × 1 = ${basePoints >= 0 ? '+' : ''}${basePoints.toFixed(2)} points`,
      show: currentStep >= 5
    },
    {
      title: 'Final Points',
      description: 'Total points earned',
      value: `${finalPoints >= 0 ? '+' : ''}${finalPoints.toFixed(2)} pts`,
      formula: 'Final Points',
      show: currentStep >= 6
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setIsAnimating(false);
      }, 300);
    }
  };

  const handleReset = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep(0);
      setIsAnimating(false);
    }, 300);
  };

  const handleAutoPlay = () => {
    setCurrentStep(0);
    setIsAnimating(true);
    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step <= steps.length - 1) {
        setCurrentStep(step);
      } else {
        clearInterval(interval);
        setIsAnimating(false);
      }
    }, 1500);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const importantPoints: PointRule[] = [
    {
      title: 'Base Value Recording',
      description: 'When a token is added to your team, its current price is recorded as the base value',
      points: 'Base Value = Entry Price',
      example: 'If BTC is $88,150 when added, that becomes the base value'
    },
    {
      title: 'Percentage Change Calculation',
      description: 'Points are calculated based on the percentage change from the base value',
      points: '1% Change = 1 Point',
      example: 'If BTC goes from $88,150 to $89,050 (+1%), you earn +1 point'
    },
    {
      title: 'Captain Multiplier',
      description: 'Captain tokens earn 2× points (both positive and negative)',
      points: 'Captain Points = Base Points × 2',
      example: 'If BTC (Captain) goes up 1%, you earn +2 points instead of +1'
    },
    {
      title: 'Vice-Captain Multiplier',
      description: 'Vice-Captain tokens earn 1.5× points (both positive and negative)',
      points: 'Vice-Captain Points = Base Points × 1.5',
      example: 'If ETH (Vice-Captain) goes up 1%, you earn +1.5 points instead of +1'
    },
    {
      title: 'Negative Points',
      description: 'If token price goes down from base value, points are negative',
      points: 'Down 1% = -1 Point',
      example: 'If BTC goes from $88,150 to $87,240 (-1%), you earn -1 point'
    },
    {
      title: 'Negative Points with Multipliers',
      description: 'Captain and Vice-Captain multipliers apply to negative points too',
      points: 'Captain: -1% = -2 Points | VC: -1% = -1.5 Points',
      example: 'If BTC (Captain) goes down 1%, you lose -2 points'
    }
  ];

  const calculationExamples: CollapsibleSection[] = [
    {
      title: 'Calculation Examples',
      icon: <Calculator className="w-5 h-5" />,
      content: [
        {
          title: 'Example 1: Regular Token (Positive)',
          description: 'ETH added at $2,977.80, current price $3,006.58',
          points: '+1% change = +1 point',
          example: 'Calculation: (($3,006.58 - $2,977.80) / $2,977.80) × 100 = +1% = +1 point'
        },
        {
          title: 'Example 2: Captain Token (Positive)',
          description: 'BTC added at $88,150, current price $89,050',
          points: '+1% change × 2 = +2 points',
          example: 'Calculation: +1% × 2 (Captain) = +2 points'
        },
        {
          title: 'Example 3: Vice-Captain Token (Positive)',
          description: 'SOL added at $126.10, current price $127.36',
          points: '+1% change × 1.5 = +1.5 points',
          example: 'Calculation: +1% × 1.5 (Vice-Captain) = +1.5 points'
        },
        {
          title: 'Example 4: Regular Token (Negative)',
          description: 'BNB added at $851.85, current price $842.33',
          points: '-1% change = -1 point',
          example: 'Calculation: (($842.33 - $851.85) / $851.85) × 100 = -1% = -1 point'
        },
        {
          title: 'Example 5: Captain Token (Negative)',
          description: 'BTC (Captain) added at $88,150, current price $87,240',
          points: '-1% change × 2 = -2 points',
          example: 'Calculation: -1% × 2 (Captain) = -2 points'
        },
        {
          title: 'Example 6: Vice-Captain Token (Negative)',
          description: 'ETH (Vice-Captain) added at $2,977.80, current price $2,948.02',
          points: '-1% change × 1.5 = -1.5 points',
          example: 'Calculation: -1% × 1.5 (Vice-Captain) = -1.5 points'
        }
      ]
    }
  ];

  const pointBreakdown: CollapsibleSection[] = [
    {
      title: 'Point Breakdown',
      icon: <Info className="w-5 h-5" />,
      content: [
        {
          title: 'Regular Token',
          description: 'Standard tokens without any special role',
          points: '1% = 1 Point (positive or negative)'
        },
        {
          title: 'Captain Token',
          description: 'Your selected captain token',
          points: '1% = 2 Points (positive or negative)'
        },
        {
          title: 'Vice-Captain Token',
          description: 'Your selected vice-captain token',
          points: '1% = 1.5 Points (positive or negative)'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className={`mb-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20 animate-pulse">
              <span className="text-xs font-bold text-white">PTS</span>
            </div>
            <h1 className="text-4xl font-bold text-white">Fantasy Points</h1>
            <button
              onClick={() => toggleSection('important')}
              className="ml-auto p-2 hover:bg-gray-800 rounded-lg transition-all duration-300 cursor-pointer hover:scale-110"
            >
              {expandedSections.important ? (
                <ChevronUp className="w-5 h-5 text-white transition-transform duration-300" />
              ) : (
                <ChevronDown className="w-5 h-5 text-white transition-transform duration-300" />
              )}
            </button>
          </div>
        </div>

        {/* Important Fantasy Points Section */}
        <div className="mb-6">
          <div className="border-2 border-white rounded-xl overflow-hidden bg-gray-900">
            <div className="bg-white/5 px-4 py-2 border-b border-white/10">
              <span className="text-xs font-semibold text-white uppercase tracking-wider">
                Important Fantasy Points
              </span>
            </div>
            
            {expandedSections.important && (
              <div className="p-6 space-y-4">
                {importantPoints.map((point, index) => {
                  const isPositive = point.points.includes('+') || point.points.includes('Base') || point.points.includes('×');
                  const isNegative = point.points.includes('-');
                  
                  return (
                    <div
                      key={index}
                      className="group relative p-5 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700 hover:border-white/30 transition-all duration-500 hover:shadow-lg hover:shadow-white/5 animate-in fade-in slide-in-from-left"
                      style={{
                        animationDelay: `${index * 100}ms`,
                        animationFillMode: 'both'
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 ${
                              index === 0 ? 'bg-blue-500/20 border border-blue-500/30 group-hover:bg-blue-500/30' :
                              index === 1 ? 'bg-white/10 border border-white/20 group-hover:bg-white/20' :
                              index === 2 ? 'bg-yellow-500/20 border border-yellow-500/30 group-hover:bg-yellow-500/30' :
                              index === 3 ? 'bg-gray-400/20 border border-gray-400/30 group-hover:bg-gray-400/30' :
                              index === 4 ? 'bg-red-500/20 border border-red-500/30 group-hover:bg-red-500/30' :
                              'bg-orange-500/20 border border-orange-500/30 group-hover:bg-orange-500/30'
                            }`}>
                              {index === 0 && <Calculator className="w-5 h-5 text-blue-400 animate-pulse" />}
                              {index === 1 && <TrendingUp className="w-5 h-5 text-white animate-bounce" />}
                              {index === 2 && <Crown className="w-5 h-5 text-yellow-400" />}
                              {index === 3 && <Star className="w-5 h-5 text-gray-400 animate-spin" style={{ animationDuration: '3s' }} />}
                              {index === 4 && <TrendingDown className="w-5 h-5 text-red-400 animate-pulse" />}
                              {index === 5 && <X className="w-5 h-5 text-orange-400" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-bold text-white">{point.title}</h3>
                                {point.isNew && (
                                  <span className="px-2.5 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                                    New
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-400 leading-relaxed">{point.description}</p>
                            </div>
                          </div>
                          
                          <div className="mt-4 flex items-center gap-3">
                            <div className={`px-4 py-2.5 rounded-lg border-2 font-bold text-base transition-all duration-300 group-hover:scale-110 ${
                              isPositive ? 'bg-white/10 border-white/30 text-white group-hover:bg-white/20' :
                              isNegative ? 'bg-red-500/10 border-red-500/30 text-red-400 group-hover:bg-red-500/20' :
                              'bg-white/10 border-white/30 text-white group-hover:bg-white/20'
                            }`}>
                              <span className="inline-block animate-pulse">{point.points}</span>
                            </div>
                            {point.example && (
                              <div className="flex-1 px-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700">
                                <p className="text-xs text-gray-400 italic">{point.example}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Calculation Examples Section */}
        {calculationExamples.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-6">
            <div className="border border-gray-800 rounded-xl overflow-hidden bg-gray-900">
              <button
                onClick={() => toggleSection(`calculation-${sectionIndex}`)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-800 transition-all duration-300 cursor-pointer hover:scale-[1.01]"
              >
                <div className="flex items-center gap-3">
                  <div className="transition-transform duration-300 group-hover:rotate-12">
                    {section.icon}
                  </div>
                  <h2 className="text-lg font-semibold text-white">{section.title}</h2>
                </div>
                {expandedSections[`calculation-${sectionIndex}`] ? (
                  <ChevronUp className="w-5 h-5 text-gray-400 transition-transform duration-300 rotate-180" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400 transition-transform duration-300" />
                )}
              </button>

              {expandedSections[`calculation-${sectionIndex}`] && (
                <div className="p-6 space-y-4 border-t border-gray-800">
                  {section.content.map((point, index) => {
                    const isPositive = point.points.includes('+');
                    const isNegative = point.points.includes('-');
                    const isCaptain = point.title.includes('Captain') && !point.title.includes('Vice');
                    const isViceCaptain = point.title.includes('Vice-Captain');
                    
                    return (
                      <div
                        key={index}
                        className="group p-5 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 hover:border-white/20 transition-all duration-500 hover:scale-[1.02] animate-in fade-in slide-in-from-right"
                        style={{
                          animationDelay: `${index * 100}ms`,
                          animationFillMode: 'both'
                        }}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            isCaptain ? 'bg-yellow-500/20 border-2 border-yellow-500/40' :
                            isViceCaptain ? 'bg-gray-400/20 border-2 border-gray-400/40' :
                            isPositive ? 'bg-white/10 border-2 border-white/20' :
                            'bg-red-500/20 border-2 border-red-500/40'
                          }`}>
                            {isCaptain && <Crown className="w-6 h-6 text-yellow-400" />}
                            {isViceCaptain && <Star className="w-6 h-6 text-gray-400" />}
                            {isPositive && !isCaptain && !isViceCaptain && <ArrowUp className="w-6 h-6 text-white" />}
                            {isNegative && !isCaptain && !isViceCaptain && <ArrowDown className="w-6 h-6 text-red-400" />}
                          </div>
                          
                          <div className="flex-1">
                            <h3 className="text-base font-bold text-white mb-2">{point.title}</h3>
                            <p className="text-sm text-gray-400 mb-3">{point.description}</p>
                            
                            <div className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-base mb-3 transition-all duration-300 group-hover:scale-110 ${
                              isPositive ? 'bg-white/10 border-2 border-white/30 text-white group-hover:bg-white/20 group-hover:shadow-lg group-hover:shadow-white/20' :
                              'bg-red-500/10 border-2 border-red-500/30 text-red-400 group-hover:bg-red-500/20 group-hover:shadow-lg group-hover:shadow-red-500/20'
                            }`}>
                              {isPositive && <Check className="w-4 h-4 animate-bounce" />}
                              {isNegative && <X className="w-4 h-4 animate-pulse" />}
                              <span>{point.points}</span>
                            </div>
                            
                            {point.example && (
                              <div className="mt-3 p-3 bg-gray-900/80 rounded-lg border border-gray-700">
                                <p className="text-xs text-gray-300 font-mono leading-relaxed">{point.example}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Point Breakdown Section */}
        {pointBreakdown.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-6">
            <div className="border border-gray-800 rounded-xl overflow-hidden bg-gray-900">
              <button
                onClick={() => toggleSection(`breakdown-${sectionIndex}`)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-800 transition-all duration-300 cursor-pointer hover:scale-[1.01]"
              >
                <div className="flex items-center gap-3">
                  <div className="transition-transform duration-300 group-hover:rotate-12">
                    {section.icon}
                  </div>
                  <h2 className="text-lg font-semibold text-white">{section.title}</h2>
                </div>
                {expandedSections[`breakdown-${sectionIndex}`] ? (
                  <ChevronUp className="w-5 h-5 text-gray-400 transition-transform duration-300 rotate-180" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400 transition-transform duration-300" />
                )}
              </button>

              {expandedSections[`breakdown-${sectionIndex}`] && (
                <div className="p-6 space-y-4 border-t border-gray-800">
                  {section.content.map((point, index) => {
                    const isCaptain = index === 1;
                    const isViceCaptain = index === 2;
                    
                    return (
                      <div
                        key={index}
                        className={`p-5 rounded-xl border-2 transition-all duration-500 hover:scale-[1.02] animate-in fade-in zoom-in ${
                          isCaptain ? 'bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/40 hover:shadow-yellow-500/20 hover:shadow-xl' :
                          isViceCaptain ? 'bg-gradient-to-br from-gray-400/10 to-gray-400/5 border-gray-400/40 hover:shadow-gray-400/20 hover:shadow-xl' :
                          'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 hover:shadow-white/10 hover:shadow-xl'
                        }`}
                        style={{
                          animationDelay: `${index * 150}ms`,
                          animationFillMode: 'both'
                        }}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 ${
                            isCaptain ? 'bg-yellow-500/20 border-2 border-yellow-500/40 group-hover:bg-yellow-500/30 group-hover:shadow-lg group-hover:shadow-yellow-500/30' :
                            isViceCaptain ? 'bg-gray-400/20 border-2 border-gray-400/40 group-hover:bg-gray-400/30 group-hover:shadow-lg group-hover:shadow-gray-400/30' :
                            'bg-white/10 border-2 border-white/20 group-hover:bg-white/20 group-hover:shadow-lg group-hover:shadow-white/20'
                          }`}>
                            {isCaptain && <Crown className="w-7 h-7 text-yellow-400 animate-pulse" />}
                            {isViceCaptain && <Star className="w-7 h-7 text-gray-400 animate-spin" style={{ animationDuration: '3s' }} />}
                            {!isCaptain && !isViceCaptain && <Trophy className="w-7 h-7 text-white" />}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-white mb-2">{point.title}</h3>
                            <p className="text-sm text-gray-400 mb-4">{point.description}</p>
                            <div className="flex items-center gap-3">
                              <div className={`px-4 py-2.5 rounded-lg font-bold text-base transition-all duration-300 hover:scale-110 ${
                                isCaptain ? 'bg-yellow-500/20 border-2 border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/30 hover:shadow-lg hover:shadow-yellow-500/30' :
                                isViceCaptain ? 'bg-gray-400/20 border-2 border-gray-400/40 text-gray-300 hover:bg-gray-400/30 hover:shadow-lg hover:shadow-gray-400/30' :
                                'bg-white/10 border-2 border-white/30 text-white hover:bg-white/20 hover:shadow-lg hover:shadow-white/20'
                              }`}>
                                <span className="inline-block">{point.points}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Step-by-Step Calculation Animation */}
        <div className={`mt-8 p-8 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border-2 border-white/20 shadow-2xl transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              <Calculator className="w-8 h-8 text-white animate-pulse" />
              Step-by-Step Calculation
            </h2>
            <div className="flex items-center gap-3">
              <select
                value={selectedExample}
                onChange={(e) => {
                  setSelectedExample(e.target.value as any);
                  setCurrentStep(0);
                }}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white cursor-pointer hover:bg-gray-700 transition-colors"
              >
                <option value="regular">Regular Token</option>
                <option value="captain">Captain Token</option>
                <option value="viceCaptain">Vice-Captain Token</option>
                <option value="negative">Negative Example</option>
              </select>
            </div>
          </div>

          {/* Token Info Card */}
          <div className={`mb-6 p-6 rounded-xl border-2 transition-all duration-500 ${
            example.color === 'yellow' ? 'bg-yellow-500/10 border-yellow-500/40' :
            example.color === 'gray' ? 'bg-gray-400/10 border-gray-400/40' :
            'bg-white/10 border-white/30'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                example.color === 'yellow' ? 'bg-yellow-500/20 border-2 border-yellow-500/40' :
                example.color === 'gray' ? 'bg-gray-400/20 border-2 border-gray-400/40' :
                'bg-white/10 border-2 border-white/20'
              }`}>
                <example.icon className={`w-8 h-8 ${
                  example.color === 'yellow' ? 'text-yellow-400' :
                  example.color === 'gray' ? 'text-gray-400' :
                  'text-white'
                }`} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">{example.token}</h3>
                <p className={`text-sm ${
                  example.color === 'yellow' ? 'text-yellow-400' :
                  example.color === 'gray' ? 'text-gray-400' :
                  'text-gray-400'
                }`}>
                  {example.role} {example.role !== 'Regular' && `(${example.multiplier}× multiplier)`}
                </p>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-4 mb-6">
            {steps.map((step, index) => {
              const Icon = index === 0 ? Calculator : 
                          index === 1 ? TrendingUp :
                          index === 2 ? ArrowRight :
                          index === 3 ? Percent :
                          index === 4 ? Trophy :
                          index === 5 ? X :
                          Check;
              
              return (
                <div
                  key={index}
                  className={`relative transition-all duration-500 ${
                    step.show 
                      ? 'opacity-100 translate-x-0' 
                      : 'opacity-0 -translate-x-8 pointer-events-none'
                  }`}
                  style={{
                    transitionDelay: `${index * 100}ms`
                  }}
                >
                  <div className={`p-6 rounded-xl border-2 transition-all duration-500 ${
                    step.show && !isAnimating
                      ? example.color === 'yellow' && index === steps.length - 1
                        ? 'bg-yellow-500/20 border-yellow-500/50 shadow-lg shadow-yellow-500/30 scale-105'
                        : example.color === 'gray' && index === steps.length - 1
                        ? 'bg-gray-400/20 border-gray-400/50 shadow-lg shadow-gray-400/30 scale-105'
                        : 'bg-gray-800 border-gray-700 hover:border-white/30 hover:scale-[1.02]'
                      : 'bg-gray-800 border-gray-700'
                  }`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                        step.show && index === currentStep
                          ? example.color === 'yellow' ? 'bg-yellow-500/30 border-2 border-yellow-500/50 scale-110 animate-pulse' :
                            example.color === 'gray' ? 'bg-gray-400/30 border-2 border-gray-400/50 scale-110 animate-pulse' :
                            'bg-white/20 border-2 border-white/40 scale-110 animate-pulse'
                          : 'bg-gray-700 border-2 border-gray-600'
                      }`}>
                        <Icon className={`w-6 h-6 ${
                          step.show && index === currentStep
                            ? example.color === 'yellow' ? 'text-yellow-400' :
                              example.color === 'gray' ? 'text-gray-300' :
                              'text-white'
                            : 'text-gray-500'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-bold text-white">{step.title}</h3>
                          {index === currentStep && (
                            <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-white animate-pulse">
                              Current Step
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mb-3">{step.description}</p>
                        <div className={`inline-block px-4 py-2 rounded-lg font-bold text-xl mb-2 transition-all duration-300 ${
                          step.show && index === currentStep
                            ? percentageChange >= 0 
                              ? 'bg-white/20 border-2 border-white/40 text-white scale-110' 
                              : 'bg-red-500/20 border-2 border-red-500/40 text-red-400 scale-110'
                            : percentageChange >= 0
                            ? 'bg-white/10 border-2 border-white/20 text-white'
                            : 'bg-red-500/10 border-2 border-red-500/20 text-red-400'
                        }`}>
                          {step.value}
                        </div>
                        {step.formula && (
                          <div className="mt-3 p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                            <p className="text-xs text-gray-300 font-mono">{step.formula}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 pt-4 border-t border-gray-700">
            <button
              onClick={handleReset}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:scale-105"
            >
              <RotateCcw className="w-5 h-5" />
              Reset
            </button>
            <button
              onClick={handleNext}
              disabled={currentStep >= steps.length - 1}
              className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:scale-105 font-semibold"
            >
              Next Step
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={handleAutoPlay}
              className="flex items-center gap-2 px-6 py-3 bg-white/10 border-2 border-white/30 text-white rounded-lg hover:bg-white/20 transition-all duration-300 cursor-pointer hover:scale-105 font-semibold"
            >
              <Play className="w-5 h-5" />
              Auto Play
            </button>
          </div>
        </div>

        {/* Visual Summary */}
        <div className={`mt-8 p-8 bg-gradient-to-br from-white/5 via-white/3 to-white/0 rounded-2xl border-2 border-white/10 shadow-2xl transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 animate-bounce">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            Quick Reference Guide
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Regular Token Card */}
            <div 
              className="group relative p-6 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border-2 border-gray-700 hover:border-white/30 transition-all duration-500 hover:shadow-xl hover:shadow-white/10 hover:scale-105 animate-in fade-in slide-in-from-bottom"
              style={{
                animationDelay: '200ms',
                animationFillMode: 'both'
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 border-2 border-white/20 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Regular Token</h3>
                  <p className="text-xs text-gray-400">No special role</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="p-3 bg-white/5 rounded-lg border border-white/10 transition-all duration-300 group-hover:bg-white/10 group-hover:border-white/20 group-hover:scale-105">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-400">Price Up</span>
                    <ArrowUp className="w-4 h-4 text-white animate-bounce" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs text-gray-500">+1% =</span>
                    <span className="text-2xl font-bold text-white animate-pulse">+1</span>
                    <span className="text-sm text-gray-400">pt</span>
                  </div>
                </div>
                
                <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20 transition-all duration-300 group-hover:bg-red-500/20 group-hover:border-red-500/30 group-hover:scale-105">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-400">Price Down</span>
                    <ArrowDown className="w-4 h-4 text-red-400 animate-pulse" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs text-gray-500">-1% =</span>
                    <span className="text-2xl font-bold text-red-400">-1</span>
                    <span className="text-sm text-gray-400">pt</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Captain Card */}
            <div 
              className="group relative p-6 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 rounded-2xl border-2 border-yellow-500/40 hover:border-yellow-500/60 transition-all duration-500 hover:shadow-xl hover:shadow-yellow-500/20 hover:scale-105 animate-in fade-in slide-in-from-bottom"
              style={{
                animationDelay: '400ms',
                animationFillMode: 'both'
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-yellow-500/20 border-2 border-yellow-500/40 flex items-center justify-center">
                  <Crown className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Captain</h3>
                  <p className="text-xs text-yellow-400/80">2× multiplier</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="p-3 bg-white/10 rounded-lg border border-white/20 transition-all duration-300 group-hover:bg-white/20 group-hover:border-white/30 group-hover:scale-105">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-300">Price Up</span>
                    <ArrowUp className="w-4 h-4 text-white animate-bounce" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs text-gray-400">+1% × 2 =</span>
                    <span className="text-2xl font-bold text-white animate-pulse">+2</span>
                    <span className="text-sm text-gray-300">pts</span>
                  </div>
                </div>
                
                <div className="p-3 bg-red-500/20 rounded-lg border border-red-500/30 transition-all duration-300 group-hover:bg-red-500/30 group-hover:border-red-500/40 group-hover:scale-105">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-300">Price Down</span>
                    <ArrowDown className="w-4 h-4 text-red-400 animate-pulse" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs text-gray-400">-1% × 2 =</span>
                    <span className="text-2xl font-bold text-red-400">-2</span>
                    <span className="text-sm text-gray-300">pts</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Vice-Captain Card */}
            <div 
              className="group relative p-6 bg-gradient-to-br from-gray-400/10 to-gray-400/5 rounded-2xl border-2 border-gray-400/40 hover:border-gray-400/60 transition-all duration-500 hover:shadow-xl hover:shadow-gray-400/20 hover:scale-105 animate-in fade-in slide-in-from-bottom"
              style={{
                animationDelay: '600ms',
                animationFillMode: 'both'
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gray-400/20 border-2 border-gray-400/40 flex items-center justify-center">
                  <Star className="w-6 h-6 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Vice-Captain</h3>
                  <p className="text-xs text-gray-400/80">1.5× multiplier</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="p-3 bg-white/10 rounded-lg border border-white/20 transition-all duration-300 group-hover:bg-white/20 group-hover:border-white/30 group-hover:scale-105">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-300">Price Up</span>
                    <ArrowUp className="w-4 h-4 text-white animate-bounce" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs text-gray-400">+1% × 1.5 =</span>
                    <span className="text-2xl font-bold text-white animate-pulse">+1.5</span>
                    <span className="text-sm text-gray-300">pts</span>
                  </div>
                </div>
                
                <div className="p-3 bg-red-500/20 rounded-lg border border-red-500/30 transition-all duration-300 group-hover:bg-red-500/30 group-hover:border-red-500/40 group-hover:scale-105">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-300">Price Down</span>
                    <ArrowDown className="w-4 h-4 text-red-400 animate-pulse" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs text-gray-400">-1% × 1.5 =</span>
                    <span className="text-2xl font-bold text-red-400">-1.5</span>
                    <span className="text-sm text-gray-300">pts</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

