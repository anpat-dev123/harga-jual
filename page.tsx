
"use client";
import { useState, useEffect, useRef } from "react";
import { useReactToPrint } from "react-to-print";

export default function Home() {
  const [items, setItems] = useState([{ nama: "", harga: 0, jumlah: 0, satuan: "gram", total: 0 }]);
  const [biayaLain, setBiayaLain] = useState(0);
  const [markupMode, setMarkupMode] = useState(true);
  const [persentase, setPersentase] = useState(0);
  const [jumlahProduksi, setJumlahProduksi] = useState(1);
  const [hasil, setHasil] = useState(null);
  const [resepList, setResepList] = useState([]);
  const [resepName, setResepName] = useState("");
  const cetakRef = useRef();

  useEffect(() => {
    const saved = localStorage.getItem("resepList");
    if (saved) setResepList(JSON.parse(saved));
  }, []);

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    if (field === "nama" || field === "satuan") {
      newItems[index][field] = value;
    } else {
      newItems[index][field] = parseFloat(value) || 0;
    }
    const { harga, jumlah } = newItems[index];
    newItems[index].total = (harga / 1000) * jumlah;
    setItems(newItems);
  };

  const tambahBaris = () => {
    setItems([...items, { nama: "", harga: 0, jumlah: 0, satuan: "gram", total: 0 }]);
  };

  const hitung = () => {
    const totalBahan = items.reduce((acc, item) => acc + item.total, 0);
    const hpp = totalBahan + parseFloat(biayaLain);
    let hargaJual = 0;
    let margin = 0;

    if (markupMode) {
      hargaJual = hpp * (1 + persentase / 100);
      margin = ((hargaJual - hpp) / hargaJual) * 100;
    } else {
      hargaJual = hpp / (1 - persentase / 100);
      margin = persentase;
    }

    const hppPerPcs = hpp / jumlahProduksi;
    const hargaJualPerPcs = hargaJual / jumlahProduksi;
    const keuntunganPerPcs = hargaJualPerPcs - hppPerPcs;

    setHasil({ hpp, hargaJual, margin, hppPerPcs, hargaJualPerPcs, keuntunganPerPcs });
  };

  const simpanResep = () => {
    if (!resepName) return;
    const newResep = { nama: resepName, items, biayaLain, persentase, markupMode, jumlahProduksi };
    const updated = [...resepList.filter(r => r.nama !== resepName), newResep];
    setResepList(updated);
    localStorage.setItem("resepList", JSON.stringify(updated));
    setResepName("");
  };

  const muatResep = (nama) => {
    const r = resepList.find(r => r.nama === nama);
    if (r) {
      setItems(r.items);
      setBiayaLain(r.biayaLain);
      setPersentase(r.persentase);
      setMarkupMode(r.markupMode);
      setJumlahProduksi(r.jumlahProduksi);
    }
  };

  const handlePrint = useReactToPrint({ content: () => cetakRef.current });

  return (
    <main className="max-w-5xl mx-auto px-4 py-6 space-y-4 font-sans">
      <h1 className="text-2xl font-bold">Kalkulator Harga Jual Lengkap</h1>

      {items.map((item, i) => (
        <div key={i} className="grid grid-cols-6 gap-2">
          <input className="border p-1" placeholder="Nama Bahan" value={item.nama} onChange={e => handleItemChange(i, "nama", e.target.value)} />
          <input type="number" className="border p-1" placeholder="Harga/Kg" value={item.harga} onChange={e => handleItemChange(i, "harga", e.target.value)} />
          <input type="number" className="border p-1" placeholder="Jumlah" value={item.jumlah} onChange={e => handleItemChange(i, "jumlah", e.target.value)} />
          <select className="border p-1" value={item.satuan} onChange={e => handleItemChange(i, "satuan", e.target.value)}>
            <option>gram</option><option>ml</option><option>pcs</option>
          </select>
          <span className="self-center">Rp{item.total.toFixed(0)}</span>
        </div>
      ))}

      <button onClick={tambahBaris} className="bg-blue-500 text-white px-3 py-1 rounded">+ Tambah Bahan</button>

      <div className="grid grid-cols-3 gap-4">
        <input type="number" placeholder="Biaya lain" value={biayaLain} onChange={e => setBiayaLain(e.target.value)} className="border p-2" />
        <input type="number" placeholder="Jumlah produk jadi" value={jumlahProduksi} onChange={e => setJumlahProduksi(parseInt(e.target.value) || 1)} className="border p-2" />
        <input placeholder="Nama Resep" value={resepName} onChange={e => setResepName(e.target.value)} className="border p-2" />
      </div>

      <div className="flex items-center gap-2">
        <label>{markupMode ? "Markup (%)" : "Margin (%)"}</label>
        <input type="checkbox" checked={markupMode} onChange={() => setMarkupMode(!markupMode)} />
        <input type="number" placeholder="Persentase" value={persentase} onChange={e => setPersentase(e.target.value)} className="border p-2 w-24" />
      </div>

      <div className="flex gap-2">
        <button onClick={hitung} className="bg-green-500 text-white px-3 py-1 rounded">Hitung</button>
        <button onClick={simpanResep} className="bg-gray-400 text-white px-3 py-1 rounded">Simpan</button>
        <select onChange={e => muatResep(e.target.value)} className="border p-1">
          <option>Muat Resep</option>
          {resepList.map((r, i) => <option key={i}>{r.nama}</option>)}
        </select>
        <button onClick={handlePrint} className="bg-yellow-500 text-black px-3 py-1 rounded">🖨 Export PDF</button>
      </div>

      {hasil && (
        <div ref={cetakRef} className="bg-white p-4 rounded shadow border space-y-2">
          <p><strong>Total HPP:</strong> Rp{hasil.hpp.toFixed(0)}</p>
          <p><strong>Harga Jual Total:</strong> Rp{hasil.hargaJual.toFixed(0)}</p>
          <p><strong>Harga Jual / pcs:</strong> Rp{hasil.hargaJualPerPcs.toFixed(0)}</p>
          <p><strong>HPP / pcs:</strong> Rp{hasil.hppPerPcs.toFixed(0)}</p>
          <p><strong>Untung / pcs:</strong> Rp{hasil.keuntunganPerPcs.toFixed(0)}</p>
          <p><strong>Margin:</strong> {hasil.margin.toFixed(2)}%</p>
        </div>
      )}
    </main>
  );
}
