/**
 * SessionSetupForm Component
 * Form for configuring a new interview session
 * Collects resume and job description, then starts interview
 */
import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Upload } from "lucide-react";

/**
 * Form for setting up a new interview session
 * Handles resume upload and job description input
 */
export function SessionSetupForm() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Handle resume file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFile(file);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resumeFile || !jobDescription) {
      return;
    }

    setIsLoading(true);

    // Store session data in sessionStorage for the interview page
    // In production, this would be sent to the backend
    const sessionId = "session_" + Date.now();
    sessionStorage.setItem("current_session", sessionId);
    sessionStorage.setItem("job_description", jobDescription);

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Navigate to interview page
    navigate("/interview");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Resume upload */}
      <div className="space-y-2">
        <Label htmlFor="resume">Resume</Label>
        <div className="relative">
          <Input
            id="resume"
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileChange}
            className="cursor-pointer"
            required
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <Upload className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        {resumeFile && (
          <p className="text-xs text-muted-foreground">
            Selected: {resumeFile.name}
          </p>
        )}
      </div>

      {/* Job description */}
      <div className="space-y-2">
        <Label htmlFor="jobDescription">Job Description</Label>
        <Textarea
          id="jobDescription"
          placeholder="Paste the job description here..."
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          rows={8}
          required
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">
          Paste the full job description to get tailored interview questions
        </p>
      </div>

      {/* Submit button */}
      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || !resumeFile || !jobDescription}
      >
        {isLoading ? "Starting session..." : "Start Interview"}
      </Button>
    </form>
  );
}
