"use client";

import { memo, useCallback, useRef } from "react";
import { Position } from "@xyflow/react";
import { Video, Upload, X, Loader2 } from "lucide-react";
import NodeCard from "@/components/canvas/NodeCard";
import NodeHandle from "@/components/canvas/handles/NodeHandle";
import { useWorkflowStore } from "@/store/workflowStore";
import type { UploadVideoWorkflowNode } from "@/types/workflow";
import { cn } from "@/lib/utils";

interface UploadVideoNodeProps {
  id: string;
  data: UploadVideoWorkflowNode["data"];
}

const ACCEPTED = ".mp4,.mov,.webm,.m4v";

function UploadVideoNode({ id, data }: UploadVideoNodeProps) {
  const { updateNodeData, executionStates } = useWorkflowStore();
  const execState = executionStates[id];
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      updateNodeData<UploadVideoWorkflowNode>(id, (prev) => ({
        ...prev,
        uploadProgress: 0,
        fileName: file.name,
      }));

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("nodeId", id);
        formData.append("type", "video");

        const interval = setInterval(() => {
          updateNodeData<UploadVideoWorkflowNode>(id, (prev) => ({
            ...prev,
            uploadProgress: Math.min((prev.uploadProgress as number) + 10, 90),
          }));
        }, 300);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        clearInterval(interval);

        if (res.ok) {
          const json = (await res.json()) as { url: string };
          updateNodeData<UploadVideoWorkflowNode>(id, (prev) => ({
            ...prev,
            videoUrl: json.url,
            uploadProgress: 100,
          }));
        } else {
          const objectUrl = URL.createObjectURL(file);
          updateNodeData<UploadVideoWorkflowNode>(id, (prev) => ({
            ...prev,
            videoUrl: objectUrl,
            uploadProgress: 100,
          }));
        }
      } catch {
        const objectUrl = URL.createObjectURL(file);
        updateNodeData<UploadVideoWorkflowNode>(id, (prev) => ({
          ...prev,
          videoUrl: objectUrl,
          uploadProgress: 100,
        }));
      }
    },
    [id, updateNodeData]
  );

  const handleClear = useCallback(() => {
    updateNodeData<UploadVideoWorkflowNode>(id, (prev) => ({
      ...prev,
      videoUrl: null,
      uploadProgress: 0,
      fileName: null,
    }));
    if (inputRef.current) inputRef.current.value = "";
  }, [id, updateNodeData]);

  const isUploading =
    data.uploadProgress > 0 && data.uploadProgress < 100 && !data.videoUrl;

  return (
    <NodeCard
      id={id}
      title="Upload Video"
      icon={<Video size={12} />}
      executionStatus={execState?.status ?? "idle"}
      minWidth={260}
    >
      {data.videoUrl ? (
        /* Preview */
        <div className="relative rounded-lg overflow-hidden bg-[#0d0d14] border border-[#2a2a40] group">
          <video
            src={data.videoUrl}
            className="w-full h-36 object-cover"
            controls
            preload="metadata"
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
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "nodrag w-full h-28 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors",
            isUploading
              ? "border-amber-500/40 bg-amber-500/5"
              : "border-[#2a2a40] hover:border-amber-500/40 hover:bg-amber-500/5"
          )}
        >
          {isUploading ? (
            <>
              <Loader2 size={20} className="text-amber-400 animate-spin" />
              <span className="text-xs text-amber-400">
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
                MP4, MOV, WebM, M4V
              </span>
            </>
          )}
        </button>
      )}

      {isUploading && (
        <div className="mt-2 h-1 bg-[#2a2a40] rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 rounded-full transition-all duration-200"
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

      <div className="flex justify-end mt-2 -mr-3">
        <NodeHandle
          type="source"
          position={Position.Right}
          id="output-video_url"
          label="video_url"
          dataType="video"
        />
      </div>
    </NodeCard>
  );
}

export default memo(UploadVideoNode);
