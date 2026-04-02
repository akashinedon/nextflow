"use client";

import { memo, useCallback, useRef } from "react";
import { Position } from "@xyflow/react";
import { Image as ImageIcon, Upload, X, Loader2 } from "lucide-react";
import NodeCard from "@/components/canvas/NodeCard";
import NodeHandle from "@/components/canvas/handles/NodeHandle";
import { useWorkflowStore } from "@/store/workflowStore";
import type { UploadImageWorkflowNode } from "@/types/workflow";
import { cn } from "@/lib/utils";

interface UploadImageNodeProps {
  id: string;
  data: UploadImageWorkflowNode["data"];
}

const ACCEPTED = ".jpg,.jpeg,.png,.webp,.gif";

function UploadImageNode({ id, data }: UploadImageNodeProps) {
  const { updateNodeData, executionStates } = useWorkflowStore();
  const execState = executionStates[id];
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Set uploading state
      updateNodeData<UploadImageWorkflowNode>(id, (prev) => ({
        ...prev,
        uploadProgress: 0,
        fileName: file.name,
      }));

      try {
        // Transloadit upload via fetch to our API route
        const formData = new FormData();
        formData.append("file", file);
        formData.append("nodeId", id);
        formData.append("type", "image");

        // Simulate progress (real Transloadit progress in Phase 3)
        const interval = setInterval(() => {
          updateNodeData<UploadImageWorkflowNode>(id, (prev) => ({
            ...prev,
            uploadProgress: Math.min((prev.uploadProgress as number) + 15, 90),
          }));
        }, 200);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        clearInterval(interval);

        if (res.ok) {
          const json = (await res.json()) as { url: string };
          updateNodeData<UploadImageWorkflowNode>(id, (prev) => ({
            ...prev,
            imageUrl: json.url,
            uploadProgress: 100,
          }));
        } else {
          // Fallback: use object URL for preview
          const objectUrl = URL.createObjectURL(file);
          updateNodeData<UploadImageWorkflowNode>(id, (prev) => ({
            ...prev,
            imageUrl: objectUrl,
            uploadProgress: 100,
          }));
        }
      } catch {
        // Fallback to local preview
        const objectUrl = URL.createObjectURL(file);
        updateNodeData<UploadImageWorkflowNode>(id, (prev) => ({
          ...prev,
          imageUrl: objectUrl,
          uploadProgress: 100,
        }));
      }
    },
    [id, updateNodeData]
  );

  const handleClear = useCallback(() => {
    updateNodeData<UploadImageWorkflowNode>(id, (prev) => ({
      ...prev,
      imageUrl: null,
      uploadProgress: 0,
      fileName: null,
    }));
    if (inputRef.current) inputRef.current.value = "";
  }, [id, updateNodeData]);

  const isUploading =
    data.uploadProgress > 0 && data.uploadProgress < 100 && !data.imageUrl;

  return (
    <NodeCard
      id={id}
      title="Upload Image"
      icon={<ImageIcon size={12} />}
      executionStatus={execState?.status ?? "idle"}
      minWidth={260}
    >
      {data.imageUrl ? (
        /* Preview */
        <div className="relative rounded-lg overflow-hidden bg-[#0d0d14] border border-[#2a2a40] group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.imageUrl}
            alt={data.fileName ?? "Uploaded image"}
            className="w-full h-36 object-cover"
          />
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleClear}
            className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
          >
            <X size={10} />
          </button>
          {data.fileName && (
            <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-black/50 backdrop-blur-sm">
              <p className="text-[10px] text-slate-300 truncate">{data.fileName}</p>
            </div>
          )}
        </div>
      ) : (
        /* Upload dropzone */
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "nodrag w-full h-28 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors",
            isUploading
              ? "border-violet-500/40 bg-violet-500/5"
              : "border-[#2a2a40] hover:border-violet-500/40 hover:bg-violet-500/5"
          )}
        >
          {isUploading ? (
            <>
              <Loader2 size={20} className="text-violet-400 animate-spin" />
              <span className="text-xs text-violet-400">
                {data.uploadProgress}%
              </span>
            </>
          ) : (
            <>
              <Upload size={18} className="text-slate-600" />
              <span className="text-xs text-slate-500">
                Click or drag to upload
              </span>
              <span className="text-[10px] text-slate-700">
                JPG, PNG, WebP, GIF
              </span>
            </>
          )}
        </button>
      )}

      {/* Progress bar */}
      {isUploading && (
        <div className="mt-2 h-1 bg-[#2a2a40] rounded-full overflow-hidden">
          <div
            className="h-full bg-violet-500 rounded-full transition-all duration-200"
            style={{ width: `${data.uploadProgress}%` }}
          />
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Output handle */}
      <div className="flex justify-end mt-2 -mr-3">
        <NodeHandle
          type="source"
          position={Position.Right}
          id="output-image_url"
          label="image_url"
          dataType="image"
        />
      </div>
    </NodeCard>
  );
}

export default memo(UploadImageNode);
