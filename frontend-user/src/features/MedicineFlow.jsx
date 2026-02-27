import { useState } from 'react';
import { Upload, FileText, Check, Loader } from 'lucide-react';
import { patientAPI } from '../services/api';

const MedicineFlow = ({ onBack }) => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState(null);

    const handleFileChange = (e) => {
        if (e.target.files[0]) setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);

        const formData = new FormData();
        const user = JSON.parse(localStorage.getItem('user'));
        formData.append('patient_id', user.id);
        formData.append('file', file);

        try {
            const { data } = await patientAPI.uploadPrescription(formData);
            setResult(data);
        } catch {
            alert("Upload Failed");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg mx-auto border border-teal-100 text-center">
            {!result ? (
                <>
                    <h2 className="text-2xl font-bold text-teal-800 mb-2">Upload Prescription</h2>
                    <p className="text-slate-500 mb-8">We will extract the medicines and check stock.</p>

                    <div className="border-2 border-dashed border-teal-200 rounded-xl p-10 bg-teal-50/50 hover:bg-teal-50 transition-colors relative">
                        <input type="file" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" />
                        <div className="flex flex-col items-center gap-3">
                            <Upload size={40} className="text-teal-400" />
                            <span className="text-teal-700 font-medium">{file ? file.name : "Click to Upload Image"}</span>
                        </div>
                    </div>

                    <button onClick={handleUpload} disabled={!file || uploading} className="w-full mt-6 bg-purple-600 text-white p-3 rounded-xl hover:bg-purple-700 transition-all font-bold shadow-lg shadow-purple-200 flex justify-center items-center gap-2 disabled:opacity-50">
                        {uploading ? <Loader className="animate-spin" /> : "Analyze Prescription"}
                    </button>
                    <button onClick={onBack} className="mt-4 text-sm text-slate-400 hover:text-slate-600">Cancel</button>
                </>
            ) : (
                <div className="text-center">
                    <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">Order Placed!</h3>
                    <p className="text-slate-500 mt-2 mb-6">We analyzed your prescription.</p>

                    <div className="bg-slate-50 p-4 rounded-lg text-left text-sm text-slate-600 mb-6 font-mono border border-slate-200">
                        {result.extracted_preview}
                    </div>

                    <button onClick={onBack} className="bg-teal-600 text-white px-6 py-2 rounded-lg">Done</button>
                </div>
            )}
        </div>
    );
};

export default MedicineFlow;