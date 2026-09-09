import { PageHero } from "./PageHero";

type Section = { title: string; paragraphs: string[] };

export function InstitutionalPage({ title, sections, updatedAt }: {
  title: string;
  sections: Section[];
  updatedAt?: string;
}) {
  return (
    <>
      <PageHero
        eyebrow="FLOW JESUS"
        title={<span className="text-brand-yellow break-words">{title}</span>}
        subtitle={updatedAt ? `Última atualização: ${updatedAt}` : undefined}
      />
      <article className="mx-auto max-w-3xl space-y-10 px-4 py-12 md:px-8 md:py-16">
        {sections.map((section, index) => (
          <section key={index} className="space-y-4">
            {section.title && <h2 className="font-display text-xl text-brand-yellow md:text-2xl">{section.title}</h2>}
            {section.paragraphs.map((paragraph, paragraphIndex) => {
              const questionEnd = paragraph.indexOf("?");
              return (
                <p key={paragraphIndex} className="break-words text-base leading-relaxed text-white/70">
                  {section.title.startsWith("Sobre ") && questionEnd >= 0 ? (
                    <><strong className="mb-1 block font-semibold text-white">{paragraph.slice(0, questionEnd + 1)}</strong>{paragraph.slice(questionEnd + 1).trim()}</>
                  ) : paragraph}
                </p>
              );
            })}
          </section>
        ))}
      </article>
    </>
  );
}
