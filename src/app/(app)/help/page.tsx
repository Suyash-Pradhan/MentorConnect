"use client";

import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import Link from 'next/link';

const faqs = [
  {
    question: "How do I select my role (Student/Alumni)?",
    answer: "On your first login, you will be prompted to select your role. This is usually a one-time selection to help us tailor your experience. If you need to change your role, please contact support.",
  },
  {
    question: "How can I update my profile information?",
    answer: "Navigate to the 'My Profile' page from the sidebar. You will find an 'Edit Profile' button there, which will allow you to update your details.",
  },
  {
    question: "How do I search for alumni?",
    answer: "If you are a student, you can access the 'Alumni Directory' from the sidebar. This page provides search and filter options to find alumni based on name, skills, company, industry, etc.",
  },
  {
    question: "How does the mentorship system work?",
    answer: "Students can browse the Alumni Directory and send mentorship requests to alumni. Alumni will receive these requests and can choose to accept, reject, or reply with a message. Both students and alumni can track their mentorships on the 'Mentorship' page.",
  },
  {
    question: "Can students create posts or discussion threads?",
    answer: "Students can view and comment on posts and discussion threads created by alumni. However, only alumni have the permission to create new posts or discussion threads.",
  },
  {
    question: "I have a technical issue or a question not listed here. What should I do?",
    answer: "You can use our AI Chatbot for instant answers to common questions. If you need further assistance, please reach out to our support team using the contact information provided on this page.",
  },
];

export default function HelpPage() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="text-center mb-12">
        <Icons.help className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl font-bold text-foreground">Help &amp; Support</h1>
        <p className="text-lg text-muted-foreground mt-2">Find answers to common questions and learn how to use MentorConnect.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-2xl">Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem value={`item-${index}`} key={index}>
                    <AccordionTrigger className="text-left hover:no-underline text-md font-semibold">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Icons.chatbot className="h-6 w-6 text-primary" />
                AI Chatbot
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-3">
                Have a quick question? Our AI Chatbot can help answer FAQs instantly.
              </p>
              <Button asChild className="w-full">
                <Link href="/chatbot">
                  Ask the Chatbot <Icons.arrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Icons.mail className="h-6 w-6 text-primary" />
                Contact Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-1">
                If you need further assistance, please email us at:
              </p>
              <a href="mailto:support@mentorconnect.raj.gov.in" className="font-medium text-primary hover:underline">
                support@mentorconnect.raj.gov.in
              </a>
              <p className="text-muted-foreground mt-2 text-sm">
                (Please allow 1-2 business days for a response.)
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
