import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { FileText, Upload, Trash2, ChevronRight, Star } from 'lucide-react';
import { resumeApi } from '@/api/resume.api';
import { getErrorMessage } from '@/lib/apiError';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ResumeList() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [title, setTitle] = useState('');

  const resumesQuery = useQuery({
    queryKey: ['resumes'],
    queryFn: () => resumeApi.list({ limit: 20 }),
    select: (res) => res.data.data.resumes,
  });

  const uploadMutation = useMutation({
    mutationFn: () => {
      const formData = new FormData();
      formData.append('resume', selectedFile);
      if (title.trim()) formData.append('title', title.trim());
      return resumeApi.upload(formData);
    },
    onSuccess: () => {
      toast.success('Resume uploaded successfully.');
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      setUploadOpen(false);
      setSelectedFile(null);
      setTitle('');
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Failed to upload resume.')),
  });

  const deleteMutation = useMutation({
    mutationFn: resumeApi.remove,
    onSuccess: () => {
      toast.success('Resume deleted.');
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are supported.');
      return;
    }
    setSelectedFile(file);
    setUploadOpen(true);
  };

  const resumes = resumesQuery.data || [];

  return (
    <div>
      <PageHeader
        title="Resumes"
        description="Upload resumes and run AI-powered analysis on any of them."
        actions={
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4" /> Upload resume
            </Button>
          </>
        }
      />

      {resumesQuery.isError && <ErrorState message="Couldn't load your resumes." onRetry={resumesQuery.refetch} />}

      {resumesQuery.isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-lg" />
          ))}
        </div>
      )}

      {!resumesQuery.isLoading && !resumesQuery.isError && resumes.length === 0 && (
        <EmptyState
          icon={FileText}
          title="No resumes yet"
          description="Upload your first resume (PDF) to get an ATS score, skill analysis, and improvement suggestions."
          action={
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4" /> Upload resume
            </Button>
          }
        />
      )}

      {resumes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {resumes.map((resume) => (
            <Card key={resume._id} className="group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-ember/10 text-ember shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <button
                    onClick={() => deleteMutation.mutate(resume._id)}
                    className="text-muted-foreground hover:text-danger cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Delete resume"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <Link to={`/resumes/${resume._id}`} className="block">
                  <h3 className="font-display font-semibold text-sm truncate mb-1 hover:text-ember transition-colors">
                    {resume.title}
                  </h3>
                </Link>
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <Badge variant="secondary">v{resume.version}</Badge>
                  {resume.isActive && (
                    <Badge variant="default">
                      <Star className="h-3 w-3 mr-1" /> Active
                    </Badge>
                  )}
                  <Badge variant="outline" className="capitalize">
                    {resume.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Uploaded {new Date(resume.createdAt).toLocaleDateString()}
                </p>
                <Link
                  to={`/resumes/${resume._id}`}
                  className="flex items-center gap-1 text-sm text-ember hover:underline font-medium"
                >
                  View & analyze <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={uploadOpen}
        onOpenChange={(open) => {
          setUploadOpen(open);
          if (!open) {
            setSelectedFile(null);
            setTitle('');
            if (fileInputRef.current) fileInputRef.current.value = '';
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload resume</DialogTitle>
            <DialogDescription>Give this resume a title so you can find it later.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-md border border-border bg-surface-2 px-3 py-2 text-sm">
              <FileText className="h-4 w-4 text-ember shrink-0" />
              <span className="truncate">{selectedFile?.name}</span>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="resume-title">Title (optional)</Label>
              <Input
                id="resume-title"
                placeholder="e.g. Frontend Developer Resume"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setUploadOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => uploadMutation.mutate()} loading={uploadMutation.isPending}>
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
