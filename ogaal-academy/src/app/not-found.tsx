import Link from "next/link";

export default function NotFound() {
  return (
    <section className="container-x py-28 text-center">
      <p className="eyebrow eyebrow-plain">Page not found</p>
      <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">We couldn’t find that page</h1>
      <p className="mx-auto mt-4 max-w-md text-lg ">The page may have moved. Try one of these instead.</p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/" className="btn btn-primary">Back to Home</Link>
        <Link href="/contact" className="btn btn-outline">Contact Us</Link>
      </div>
    </section>
  );
}
