import {
  ChangeEvent,
  DragEvent,
  FormEvent,
  useEffect,
  useState,
} from 'react';

import {
  DocumentUploadResponse,
  JobStatusResult,
  getJobStatus,
  uploadDocument,
} from '../api/client';
import { useToast } from '../components/Toast';

interface UploadPageProps {
  onDocumentUploaded?: (documentId: string, filename: string) => void;
}

function UploadPage({
  onDocumentUploaded,
}: UploadPageProps) {
  const { showToast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] =
    useState<DocumentUploadResponse | null>(null);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [jobProgress, setJobProgress] = useState<number>(0);
  const [jobStatusText, setJobStatusText] = useState<string>('');
  const [jobResult, setJobResult] = useState<JobStatusResult | null>(null);

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0] ?? null;

    setError('');
    setUploadResult(null);
    setJobStatus(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const isPdf =
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      setSelectedFile(null);
      setError('Please select a PDF file.');
      return;
    }

    setSelectedFile(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (_e: DragEvent<HTMLDivElement>) => {
    setIsDragActive(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    setError('');
    setUploadResult(null);
    setJobStatus(null);

    const file = e.dataTransfer.files[0] ?? null;

    if (!file) {
      return;
    }

    const isPdf =
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      setSelectedFile(null);
      setError('Please drop a PDF file.');
      return;
    }

    setSelectedFile(file);
  };

  const mapStatusToProgress = (status: string): number => {
    const s = status.toLowerCase();
    if (s === 'queued' || s === 'pending') return 10;
    if (s === 'started') return 30;
    if (s === 'processing') return 60;
    if (s === 'success' || s === 'completed') return 100;
    if (s === 'failure' || s === 'revoked') return 0;
    return 30;
  };

  const mapStatusToText = (status: string): string => {
    const s = status.toLowerCase();
    if (s === 'queued' || s === 'pending') return 'Queued for processing...';
    if (s === 'started') return 'Starting extraction...';
    if (s === 'processing') return 'Extracting facts...';
    if (s === 'success' || s === 'completed') return 'Done! Document processed.';
    if (s === 'failure' || s === 'revoked') return 'Processing failed.';
    return 'Processing...';
  };

  useEffect(() => {
    if (!uploadResult?.task_id) {
      return;
    }

    let cancelled = false;
    let timeoutId: ReturnType<typeof window.setTimeout> | undefined;

    const pollJobStatus = async () => {
      try {
        const result = await getJobStatus(
          uploadResult.task_id,
        );

        if (cancelled) {
          return;
        }

        setJobStatus(result.status);
        setJobProgress(mapStatusToProgress(result.status));
        setJobStatusText(mapStatusToText(result.status));

        const status = result.status.toUpperCase();

        if (
          status === 'SUCCESS' ||
          status === 'COMPLETED'
        ) {
          setJobResult(result.result ?? null);
          const documentId =
            result.result?.document_id ?? uploadResult.document_id;
          showToast('Document processed successfully!', 'success');
          onDocumentUploaded?.(documentId, uploadResult.filename);
          return;
        }

        if (
          status === 'FAILURE' ||
          status === 'REVOKED'
        ) {
          setError(
            result.error ??
              'Document processing failed.',
          );
          showToast(result.error ?? 'Document processing failed.', 'error');
          return;
        }

        timeoutId = window.setTimeout(
          pollJobStatus,
          2000,
        );
      } catch (pollError) {
        if (cancelled) {
          return;
        }

        if (
          pollError instanceof Error &&
          pollError.message
        ) {
          setError(
            `Unable to check processing status: ${pollError.message}`,
          );
        } else {
          setError(
            'Unable to check document processing status.',
          );
        }
      }
    };

    void pollJobStatus();

    return () => {
      cancelled = true;
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    };
  }, [uploadResult, onDocumentUploaded]);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!selectedFile) {
      setError('Please select a PDF file first.');
      return;
    }

    setError('');
    setUploadResult(null);
    setJobStatus(null);
    setIsUploading(true);
    setJobProgress(0);
    setJobStatusText('');
    setJobResult(null);

    try {
      const result = await uploadDocument(selectedFile);
      setUploadResult(result);
      setJobStatus('QUEUED');
      setJobProgress(10);
      setJobStatusText('Queued for processing...');
    } catch (uploadError) {
      if (
        uploadError instanceof Error &&
        uploadError.message
      ) {
        setError(uploadError.message);
        showToast(uploadError.message, 'error');
      } else {
        const errorMessage = 'Upload failed. Make sure the FastAPI backend is running.';
        setError(errorMessage);
        showToast(errorMessage, 'error');
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section className="upload-page">
      <div className="page-heading">
        <span className="eyebrow">Document ingestion</span>
        <h2>Upload a PDF</h2>
        <p>
          Upload a source document and send it to the Fact
          Knowledge Layer for processing.
        </p>
      </div>

      <form className="upload-form" onSubmit={handleSubmit}>
        <div
          className={`file-dropzone${isDragActive ? ' drag-active' : ''}`}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <label style={{ display: 'contents', cursor: 'pointer' }}>
            <span className="file-dropzone-icon">📂</span>
            <span className="file-dropzone-title">
              {isDragActive ? 'Drop your PDF here' : 'Choose or drag a PDF document'}
            </span>

            <span className="file-dropzone-description">
              PDF files only
            </span>

            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={handleFileChange}
            />
          </label>
        </div>

        {selectedFile && (
          <div className="selected-file">
            <strong>{selectedFile.name}</strong>
            <span>
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </span>
          </div>
        )}

        {error && (
          <div className="upload-message upload-error">
            {error}
          </div>
        )}

        {uploadResult && (
          <div className="upload-message upload-success">
            <strong>Document queued successfully.</strong>

            <div>
              📄 <strong>{uploadResult.filename}</strong>
            </div>

            <div>
              Status: {jobStatus ?? uploadResult.status}
            </div>

            <div className="upload-meta">
              Document ID: {uploadResult.document_id}
            </div>

            <div className="upload-meta">
              Task ID: {uploadResult.task_id}
            </div>
          </div>
        )}

        {uploadResult && (
          <div className="upload-progress">
            <div className="upload-status-text">{jobStatusText}</div>
            <div className="upload-progress-bar" style={{ width: `${jobProgress}%` }} />
            {jobResult && (
              <div className="upload-meta">
                Facts extracted: {jobResult.fact_count ?? 0} &nbsp;·&nbsp;
                Needs review: {jobResult.needs_review_count ?? 0}
              </div>
            )}
          </div>
        )}

        <button
          className="upload-button"
          type="submit"
          disabled={!selectedFile || isUploading}
        >
          {isUploading ? 'Uploading...' : 'Upload document'}
        </button>
      </form>
    </section>
  );
}

export default UploadPage;
