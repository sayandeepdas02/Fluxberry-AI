"use client";

import { useState } from "react";
import { Panel, PanelContent, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";

export function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const faqs = [
        {
            question: "Is FluxAI just another ATS?",
            answer:
                "No. FluxAI doesn't just track candidates — it understands them. We use AI to parse resumes, screen applications, and identify the best fits before you spend time reviewing.",
        },
        {
            question: "Do candidates need an account to apply?",
            answer:
                "No. Applications are frictionless and public. Candidates simply fill out your custom form and submit — no login required.",
        },
        {
            question: "Can FluxAI replace early interview rounds?",
            answer:
                "Yes. Automated screening handles initial filtering through MCQs, coding challenges, or AI-led interviews, so you only speak with qualified candidates.",
        },
        {
            question: "Is FluxAI suitable for small teams?",
            answer:
                "Absolutely. Start simple with our Starter plan and scale as you grow. We designed FluxAI for teams of all sizes.",
        },
        {
            question: "How long does setup take?",
            answer:
                "Most teams are up and running within hours. Create a job, build your application form, publish the link, and start receiving applications immediately.",
        },
    ];

    return (
        <Panel>
            <PanelHeader>
                <PanelTitle>Answers to some Questions</PanelTitle>
            </PanelHeader>

            <PanelContent className="py-16">
                <div className="grid gap-8 md:grid-cols-12">
                    {/* Left sidebar */}
                    <div className="md:col-span-4">
                        <div className="border border-border rounded-lg p-8 bg-muted/30">
                            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                                We've worked with dozens of hiring teams — and we know what you're wondering.
                                Here are clear answers to help you decide if FluxAI is the right fit for your needs.
                            </p>

                            <div className="space-y-3">
                                <p className="text-sm font-medium">Have more questions?</p>
                                <p className="text-sm text-muted-foreground">Email us</p>
                                <Button size="sm" className="w-full">
                                    Contact us
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* FAQ accordion */}
                    <div className="md:col-span-8 space-y-4">
                        {faqs.map((faq, index) => (
                            <div
                                key={index}
                                className="border border-border rounded-lg overflow-hidden bg-background"
                            >
                                <button
                                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                    className="w-full flex items-center justify-between p-6 text-left hover:bg-muted/30 transition-colors"
                                >
                                    <span className="text-base font-medium pr-4">{faq.question}</span>
                                    {openIndex === index ? (
                                        <Minus className="size-5 flex-shrink-0" />
                                    ) : (
                                        <Plus className="size-5 flex-shrink-0" />
                                    )}
                                </button>

                                {openIndex === index && (
                                    <div className="px-6 pb-6 pt-0">
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {faq.answer}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </PanelContent>
        </Panel>
    );
}
