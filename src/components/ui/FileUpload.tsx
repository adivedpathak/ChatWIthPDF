"use client";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Inbox, Loader2 } from "lucide-react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { toast } from "react-hot-toast";

const FileUpload = () => {
  const [uploading, setUploading] = useState(false);

  const { mutate, status } = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await axios.post("/api/mongo-files", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    },
  });

  const { getRootProps, getInputProps } = useDropzone({
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0];

      if (file.size > 10 * 1024 * 1024) {
        toast.error("File too large (Max: 10MB)");
        return;
      }

      try {
        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        mutate(formData, {
          onSuccess: ({ message }) => {
            toast.success(`✅ ${message}`);
          },
          onError: (err) => {
            toast.error("❌ Error storing file");
            console.error(err);
          },
        });
      } catch (error) {
        console.error(error);
      } finally {
        setUploading(false);
      }
    },
  });

  return (
    <div className="p-4 bg-white shadow-lg rounded-xl">
      <div
        {...getRootProps({
          className:
            "border-dashed border-2 rounded-xl cursor-pointer bg-gray-50 py-8 flex justify-center items-center flex-col hover:bg-gray-100 transition",
        })}
      >
        <input {...getInputProps()} />
        {uploading || status === "pending" ? (
          <>
            <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
            <p className="mt-2 text-sm text-slate-400">Uploading...</p>
          </>
        ) : (
          <>
            <Inbox className="w-10 h-10 text-blue-500" />
            <p className="mt-2 text-sm text-slate-400">Drop PDF Here</p>
          </>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
