'use client';

import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, XCircle, X, ArrowRight } from 'lucide-react';
import { parseAndValidateCSV } from '@/lib/market-data/csv-parser';
import { marketDataService } from '@/lib/market-data/market-data-service';
import { useChartStore } from '@/store/chart-store';
import type { Symbol, AssetClass, Timeframe, DataImportResult } from '@/types/market-data';
import { cn } from '@/lib/utils';

interface ImportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImportDataModal({ isOpen, onClose }: ImportDataModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [csvContent, setCsvContent] = useState<string>('');
  const [symbolName, setSymbolName] = useState('CUSTOM_FUTURES');
  const [displayName, setDisplayName] = useState('Custom Futures Contract');
  const [assetClass, setAssetClass] = useState<AssetClass>('futures');
  const [tickSize, setTickSize] = useState('0.25');
  const [pointValue, setPointValue] = useState('50');
  const [timeframe, setTimeframe] = useState<Timeframe>('1m');
  const [result, setResult] = useState<DataImportResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const setActiveSymbol = useChartStore((s) => s.setActiveSymbol);
  const setActiveTimeframe = useChartStore((s) => s.setActiveTimeframe);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvContent(content);
      validateData(content);
    };
    reader.readAsText(selected);
  };

  const validateData = (content: string) => {
    setIsValidating(true);
    const parsedTick = parseFloat(tickSize) || 0.25;
    const parsedPoint = parseFloat(pointValue) || 50;

    const customSymbol: Symbol = {
      id: symbolName.trim().toUpperCase(),
      name: symbolName.trim().toUpperCase(),
      displayName: displayName.trim() || symbolName.trim(),
      exchange: 'CUSTOM',
      assetClass,
      pricePrecision: parsedTick < 0.01 ? 5 : 2,
      quantityPrecision: 0,
      minQuantity: 1,
      tickSize: parsedTick,
      pointValue: parsedPoint,
      tickValue: parsedTick * parsedPoint,
      description: `Uploaded dataset: ${file?.name || 'Custom CSV'}`,
    };

    const res = parseAndValidateCSV(content, customSymbol, timeframe);
    setResult(res);
    setIsValidating(false);
  };

  const handleApply = () => {
    if (!result || result.importedBars.length === 0) return;

    // Register with service
    marketDataService.registerCustomDataset(result.symbol, result.importedBars, timeframe);

    // Set as active
    setActiveSymbol(result.symbol.id);
    setActiveTimeframe(timeframe);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="w-full max-w-3xl bg-[#0d121f] border border-[#1e273b] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e273b]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Import Historical Market Data</h2>
              <p className="text-xs text-gray-400">Upload CSV OHLCV data for Futures, Forex, Crypto, or Stocks</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#1a2338] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* File Upload Area */}
          <div className="border-2 border-dashed border-[#242f48] hover:border-blue-500/50 rounded-xl p-6 text-center bg-[#101626] transition relative">
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center space-y-2">
              <FileText className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-sm font-medium text-gray-200">
                  {file ? file.name : 'Click or drag & drop historical CSV file here'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Supports timestamp/datetime, open, high, low, close, volume headers
                </p>
              </div>
            </div>
          </div>

          {/* Instrument Settings */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-[#101626] p-4 rounded-xl border border-[#1b2438]">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Symbol Code</label>
              <input
                type="text"
                value={symbolName}
                onChange={(e) => setSymbolName(e.target.value)}
                className="w-full bg-[#161f33] border border-[#25324d] rounded-lg px-3 py-1.5 text-xs text-white uppercase font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Asset Class</label>
              <select
                value={assetClass}
                onChange={(e) => setAssetClass(e.target.value as any)}
                className="w-full bg-[#161f33] border border-[#25324d] rounded-lg px-3 py-1.5 text-xs text-white"
              >
                <option value="futures">Futures</option>
                <option value="forex">Forex</option>
                <option value="crypto">Crypto</option>
                <option value="stocks">Stocks</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Tick Size</label>
              <input
                type="text"
                value={tickSize}
                onChange={(e) => setTickSize(e.target.value)}
                className="w-full bg-[#161f33] border border-[#25324d] rounded-lg px-3 py-1.5 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Point Multiplier ($)</label>
              <input
                type="text"
                value={pointValue}
                onChange={(e) => setPointValue(e.target.value)}
                className="w-full bg-[#161f33] border border-[#25324d] rounded-lg px-3 py-1.5 text-xs text-white font-mono"
              />
            </div>
          </div>

          {/* Validation Feedback */}
          {result && (
            <div className="bg-[#101626] p-4 rounded-xl border border-[#1b2438] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {result.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-400" />
                  )}
                  <span className="text-sm font-semibold text-white">
                    {result.success ? 'Data Validation Successful' : 'Validation Failed'}
                  </span>
                </div>
                <span className="text-xs font-mono text-gray-400">
                  {result.importedBars.length} / {result.totalRows} valid candles
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs font-mono bg-[#0c111e] p-3 rounded-lg text-gray-300">
                <div>
                  <span className="text-gray-500">First Candle:</span>{' '}
                  {result.startDate ? new Date(result.startDate).toISOString().slice(0, 16) : 'N/A'}
                </div>
                <div>
                  <span className="text-gray-500">Last Candle:</span>{' '}
                  {result.endDate ? new Date(result.endDate).toISOString().slice(0, 16) : 'N/A'}
                </div>
                <div>
                  <span className="text-gray-500">Tick Value:</span> ${result.symbol.tickValue.toFixed(2)}
                </div>
              </div>

              {/* Warnings */}
              {result.warnings.length > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs p-2.5 rounded-lg flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    {result.warnings.map((w, i) => (
                      <p key={i}>{w}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Errors List preview */}
              {result.errors.length > 0 && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs p-2.5 rounded-lg space-y-1">
                  <p className="font-semibold">{result.errors.length} Parsing Errors encountered:</p>
                  <ul className="list-disc pl-4 space-y-0.5 max-h-24 overflow-y-auto">
                    {result.errors.slice(0, 5).map((err, i) => (
                      <li key={i}>
                        Row {err.row}: {err.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#1e273b] bg-[#0b0f19] flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#1a2338] text-gray-200 text-xs font-medium rounded-lg hover:bg-[#232f4a] transition"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!result || !result.success || result.importedBars.length === 0}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-md transition flex items-center space-x-1.5"
          >
            <span>Load into Replay Terminal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
