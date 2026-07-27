import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Mail, BookOpen, MessagesSquare } from "lucide-react";

export const Route = createFileRoute("/dashboard/help")({ component: HelpPage });

const faqs = [
  { q: "How do I get started?", a: "Head to Upload Audio, drop a file and we take care of the rest." },
  { q: "How is my data stored?", a: "Encrypted at rest with per-workspace isolation. You can delete anything anytime." },
  { q: "Can I bring my own Groq key?", a: "Yes — add it in Settings → AI providers." },
];

function HelpPage() {
  return (
    <PageShell title="Help center" description="Guides, FAQs and a way to reach us.">
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { icon: BookOpen, t: "Documentation", d: "Deep dives, tutorials and API reference." },
          { icon: MessagesSquare, t: "Community", d: "Join our Discord for research chats." },
          { icon: Mail, t: "Contact support", d: "We reply within one business day." },
        ].map(c => (
          <Card key={c.t} className="glass border-white/10 transition hover:-translate-y-0.5 hover:shadow-glow">
            <CardContent className="p-5">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-brand shadow-glow"><c.icon className="h-5 w-5 text-white" /></span>
              <h3 className="mt-3 font-semibold">{c.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{c.d}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="mt-6 glass border-white/10"><CardContent className="p-2">
        <Accordion type="single" collapsible>
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={"i" + i} className="border-white/10 px-4">
              <AccordionTrigger>{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent></Card>
    </PageShell>
  );
}
