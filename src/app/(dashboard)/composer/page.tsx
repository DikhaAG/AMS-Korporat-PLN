

import { ComposerForm } from "@/components/composer/composer-form"

export default function ComposerPage() {
  return (
    <div className="flex flex-col h-full bg-transparent w-full max-w-[1600px] mx-auto">
      <div className="flex-1 overflow-auto py-8 lg:py-12 px-2">
        
        {/* Vanguard Toolbar */}
        <div className="mb-10 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground flex items-center gap-4">
              Buat Naskah Dinas
            </h1>
            <p className="text-muted-foreground mt-2 text-sm max-w-xl">
              Gunakan editor cerdas untuk menyusun naskah dinas. Konsep akan otomatis tersimpan sebagai draft.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* Main Editing Area */}
          <div className="xl:col-span-8">
            <ComposerForm />
          </div>

          {/* Assistant / Side Panel Area */}
          <div className="xl:col-span-4 space-y-6">
            <div className="bg-white/5 border border-border/50 rounded-3xl p-6 shadow-ambient backdrop-blur-xl">
              <h3 className="font-bold text-lg mb-2">Panduan Penulisan</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Sistem akan memformat naskah secara otomatis menjadi PDF resmi saat Anda mengirimkan naskah ini untuk direviu.
              </p>
              <ul className="text-sm space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  Pastikan tujuan dan tembusan naskah sudah sesuai.
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  Pilih klasifikasi arsip yang tepat agar masa retensi sesuai dengan aturan korporat.
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  Gunakan Heading 1 (H1) dan Heading 2 (H2) untuk menstrukturkan isi surat.
                </li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
