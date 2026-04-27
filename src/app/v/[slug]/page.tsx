import { redirect } from "next/navigation";

export default function VenueEntryPage({ params }: { params: { slug: string } }) {
  redirect(`/report?venue=${params.slug}`);
}
