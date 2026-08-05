import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-lg w-full text-center space-y-8">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">CMS Portal</h1>
          <p className="mt-3 text-lg text-gray-600">College Management System</p>
        </div>

        <div className="space-y-4">
          <Link href="/admission" className="block w-full py-4 px-6 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 hover:shadow-lg transition-all transform hover:-translate-y-1">
            Apply for Admission
          </Link>
          
          <Link href="/login" className="block w-full py-4 px-6 bg-gray-100 text-gray-800 font-semibold rounded-xl hover:bg-gray-200 transition-all">
            Staff & Student Login
          </Link>
        </div>

        <div className="pt-6 border-t border-gray-100 text-sm text-gray-500">
          Super Admin default login: <br/>
          <span className="font-mono text-gray-700 bg-gray-50 px-2 py-1 rounded">admin@college.edu</span> / <span className="font-mono text-gray-700 bg-gray-50 px-2 py-1 rounded">admin123</span>
        </div>
      </div>
    </div>
  );
}
