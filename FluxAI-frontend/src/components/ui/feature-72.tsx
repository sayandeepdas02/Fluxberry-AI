import { ArrowRight } from "lucide-react";

interface Feature {
  id: string;
  title: string;
  description: string;
  image: string;
}

interface Feature72Props {
  heading?: string;
  description?: string;
  linkUrl?: string;
  linkText?: string;
  features?: Feature[];
}

export const Feature72 = ({
  heading = "Powerful Features",
  description = "Discover the powerful features that make our platform stand out from the rest. Built with the latest technology and designed for maximum productivity.",
  linkUrl = "https://www.shadcnblocks.com",
  linkText = "Book a demo",
  features = [
    {
      id: "feature-1",
      title: "Modern Design",
      description:
        "Clean and intuitive interface built with the latest design principles. Optimized for the best user experience.",
      image: "https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "feature-2",
      title: "Responsive Layout",
      description:
        "Fully responsive design that works seamlessly across all devices and screen sizes. Perfect for any platform.",
      image: "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "feature-3",
      title: "Easy Integration",
      description:
        "Simple integration process with comprehensive documentation and dedicated support team.",
      image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "feature-4",
      title: "Advanced Analytics",
      description:
        "Powerful analytics tools to help you understand your users and make data-driven decisions.",
      image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80",
    },
  ],
}: Feature72Props) => {
  return (
    <section className="py-32">
      <div className="container flex flex-col gap-16 lg:px-16 mx-auto">
        <div className="lg:max-w-sm">
          <h2 className="mb-3 text-xl font-semibold md:mb-4 md:text-4xl lg:mb-6">
            {heading}
          </h2>
          <p className="mb-8 text-muted-foreground lg:text-lg">{description}</p>
          <a
            href={linkUrl}
            className="group flex w-fit items-center text-xs font-medium md:text-base lg:text-lg bg-black text-white px-6 py-3 hover:bg-black/90 transition-colors"
          >
            {linkText}
            <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="flex flex-col overflow-clip rounded-xl border border-border"
            >
              <div>
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="aspect-[16/9] h-full w-full object-cover object-center"
                />
              </div>
              <div className="px-6 py-8 md:px-8 md:py-10 lg:px-10 lg:py-12">
                <h3 className="mb-3 text-lg font-semibold md:mb-4 md:text-2xl lg:mb-6">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground lg:text-lg">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
