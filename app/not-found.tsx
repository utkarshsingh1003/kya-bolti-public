import Link from "next/link";
import { ButtonLink, buttonClass } from "@/components/ui";
import { IconSearch } from "@/components/icons";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] items-center justify-center py-12">
      <div className="max-w-lg text-center">
        <p className="text-6xl font-extrabold text-brand-500">404</p>
        <h1 className="hindi mt-2 text-2xl font-extrabold text-navy-900">यह पेज नहीं मिला</h1>
        <p className="mt-2 text-sm leading-relaxed text-navy-600">
          हो सकता है लिंक पुराना हो या पेज हटा दिया गया हो। आप होम पेज जा सकते हैं या खोज का उपयोग कर सकते हैं।
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <ButtonLink href="/" size="md">होम पेज</ButtonLink>
          <Link href="/search" className={buttonClass("outline", "md")}>
            <IconSearch className="h-4 w-4" /> खोजें
          </Link>
          <ButtonLink href="/news" variant="ghost" size="md">खबरें</ButtonLink>
        </div>
        <p className="mt-4 text-[0.7rem] text-navy-400">The page you are looking for was not found.</p>
      </div>
    </div>
  );
}
