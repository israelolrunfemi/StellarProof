'use client';

import React, { useState, useMemo } from 'react';
import { XMLBuilder } from 'fast-xml-parser';
import { FormatToggle, ManifestFormat } from './FormatToggle';

export const ManifestPreview = ({ manifestData }: { manifestData: any }) => {
  const [format, setFormat] = useState<ManifestFormat>('json');

  const formattedOutput = useMemo(() => {
    if (format === 'json') {
      return JSON.stringify(manifestData, null, 2);
    }

    try {
      const builder = new XMLBuilder({
        format: true,
        ignoreAttributes: false,
        suppressEmptyNode: true,
      });
      // We wrap the manifest in a root element for valid XML
      return builder.build({ Manifest: manifestData });
    } catch (error) {
      return 'Error generating XML output';
    }
  }, [manifestData, format]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Preview</span>
        <FormatToggle currentFormat={format} onFormatChange={setFormat} />
      </div>
     <div className="flex-1 p-4 overflow-auto bg-[#0f172a] custom-scrollbar"> 
        <pre className="text-xs font-mono text-blue-300 whitespace-pre-wrap leading-relaxed">
          {formattedOutput}
        </pre>
      </div>
    </div>
  );
};