import React, { useRef, useState } from 'react';
import { FolderOpen, Upload, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { APP_NAME, APP_DESCRIPTION } from '../appMetadata';
import {
  FileSystemAccessDirectorySource,
  FileListDirectorySource,
} from '../core/filesystem/BrowserDirectorySource';
import { DirectorySource } from '../core/filesystem/DirectorySource';
import { ZipDirectorySource } from '../core/filesystem/ZipDirectorySource';

interface DirectoryPickerProps {
  onSelectDirectory: (source: DirectorySource) => void;
  isLoading?: boolean;
}

export const DirectoryPicker: React.FC<DirectoryPickerProps> = ({
  onSelectDirectory,
  isLoading = false,
}) => {
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);
  const [zipBusy,setZipBusy]=useState(false);

  const handleNativePicker = async () => {
    setError(null);
    try {
      if ('showDirectoryPicker' in window) {
        // @ts-expect-error window.showDirectoryPicker is experimental / modern standard
        const handle: FileSystemDirectoryHandle = await window.showDirectoryPicker({
          mode: 'read',
        });
        const source = new FileSystemAccessDirectorySource(handle);
        onSelectDirectory(source);
      } else {
        // Fall back to folder input
        fileInputRef.current?.click();
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // User cancelled picker - do not treat as fatal error
        return;
      }
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Unable to open directory: ${msg}`);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const files = e.target.files;
    if (!files || files.length === 0) {
      return;
    }
    try {
      const source = new FileListDirectorySource(files);
      onSelectDirectory(source);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Error reading selected files: ${msg}`);
    } finally {
      // Allow selecting the same folder again after reset/failure.
      e.currentTarget.value = '';
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto py-12 px-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 sm:p-10 shadow-2xl text-center">
        {/* Header */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700 mb-6 text-zinc-100">
          <FolderOpen className="w-8 h-8 text-amber-500" />
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-zinc-100 mb-3">
          {APP_NAME}
        </h1>

        <p className="text-zinc-400 text-base leading-relaxed max-w-xl mx-auto mb-8">
          {APP_DESCRIPTION}
        </p>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-950/60 border border-red-800/80 text-red-200 text-sm flex items-start gap-3 text-left">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Source Access Error</p>
              <p className="text-xs text-red-300 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Action Button */}
        <input type="file" accept=".zip" ref={zipInputRef} className="hidden" onChange={async e=>{const file=e.target.files?.[0];if(!file)return;setZipBusy(true);setError(null);try{if(file.size>512*1024*1024)throw new Error('ZIP exceeds 512 MiB');const source=new ZipDirectorySource(file.name,new Uint8Array(await file.arrayBuffer()));onSelectDirectory(source);}catch(error){setError(error instanceof Error?error.message:String(error));}finally{setZipBusy(false);e.currentTarget.value='';}}}/>
        <button className="mb-4 rounded-lg bg-amber-600 px-8 py-4 text-zinc-950 font-bold" disabled={isLoading||zipBusy} onClick={()=>zipInputRef.current?.click()}>{zipBusy?'Reading archive…':'Open Game ZIP'}</button>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <button
            id="open-game-directory-btn"
            type="button"
            onClick={handleNativePicker}
            disabled={isLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-zinc-950 font-bold text-base transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Scanning Directory...
              </>
            ) : (
              <>
                <FolderOpen className="w-5 h-5" />
                Open Game Directory
              </>
            )}
          </button>

          {/* Hidden WebKit directory input for fallback */}
          <input
            ref={fileInputRef}
            type="file"
            {...{ webkitdirectory: '', directory: '' }}
            multiple
            className="hidden"
            onChange={handleFileInputChange}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-sm transition-colors border border-zinc-700 cursor-pointer"
            title="Alternative folder picker using standard file dialog"
          >
            <Upload className="w-4 h-4 text-zinc-400" />
            Folder Upload Fallback
          </button>
        </div>

        {/* Privacy Note */}
        <div className="pt-6 border-t border-zinc-800/80 flex items-center justify-center gap-2 text-xs text-zinc-400">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>
            Files are read locally and are not uploaded. No sample data. No automatic filesystem scanning.
          </span>
        </div>
      </div>
    </div>
  );
};
