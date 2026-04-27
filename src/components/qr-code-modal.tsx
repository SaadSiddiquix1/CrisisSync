"use client";

import { useEffect, useMemo, useRef } from "react";
import QRCode from "qrcode";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function QrCodeModal({ open, onOpenChange, slug }: { open: boolean; onOpenChange: (open: boolean) => void; slug: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const directUrl = useMemo(() => `${appUrl}/v/${slug}`, [appUrl, slug]);

  useEffect(() => {
    if (!open || !canvasRef.current) return;
    void QRCode.toCanvas(canvasRef.current, directUrl, { width: 320, margin: 1 });
  }, [open, directUrl]);

  const downloadPng = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `crisis-qr-${slug}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  const copyUrl = async () => {
    await navigator.clipboard.writeText(directUrl);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Guest reporting QR code</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-background p-3">
            <canvas ref={canvasRef} className="mx-auto h-auto w-full max-w-[320px]" />
          </div>
          <p className="break-all text-sm text-muted-foreground">{directUrl}</p>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={downloadPng}>Download PNG</Button>
            <Button variant="outline" className="flex-1" onClick={() => void copyUrl()}>Copy URL</Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Print this QR code and display it prominently in all guest areas.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
