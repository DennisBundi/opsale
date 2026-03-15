import ImportationAdmin from "@/components/admin/ImportationAdmin";

export default function ImportationPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#F4F8FF]">Importation Waitlist</h1>
        <p className="text-[#F4F8FF]/70 mt-1">
          Review and approve retailer applications to connect with Chinese suppliers.
        </p>
      </div>
      <ImportationAdmin />
    </div>
  );
}
