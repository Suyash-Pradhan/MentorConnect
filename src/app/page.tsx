import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Briefcase, GraduationCap, MessageSquareHeart, Search, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-primary text-primary-foreground py-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center px-4 md:px-6">
          <Link href="/" className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="h-8 w-8" />
            MentorConnect
          </Link>
          <nav className="space-x-4">
            <Button variant="ghost" asChild className="text-primary-foreground hover:bg-primary/80">
              <Link href="/login">Login</Link>
            </Button>
            <Button variant="secondary" asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link href="/signup">Sign Up</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary via-primary/90 to-accent py-20 text-primary-foreground">
          <div className="container mx-auto text-center px-4 md:px-6">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Connect, Learn, and Grow with MentorConnect
            </h1>
            <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto">
              Bridging the gap between students and experienced alumni for mentorship, guidance, and career opportunities in Rajasthan.
            </p>
            <Button size="lg" asChild className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg transform hover:scale-105 transition-transform">
              <Link href="/signup">
                Get Started Today <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
              Why Choose MentorConnect?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <div className="bg-primary text-primary-foreground rounded-full p-3 w-fit mb-4">
                    <Users className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-foreground">Vast Alumni Network</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Access a diverse directory of alumni from various fields and industries across Rajasthan.
                  </p>
                </CardContent>
              </Card>
              <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <div className="bg-primary text-primary-foreground rounded-full p-3 w-fit mb-4">
                    <MessageSquareHeart className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-foreground">Personalized Mentorship</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Find mentors whose experience and skills align with your career aspirations and academic interests.
                  </p>
                </CardContent>
              </Card>
              <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <div className="bg-primary text-primary-foreground rounded-full p-3 w-fit mb-4">
                    <Briefcase className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-foreground">Career Opportunities</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Discover job openings, internships, and gain insights into the professional world from experienced alumni.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 bg-secondary">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-3xl font-bold text-center mb-12 text-foreground">How It Works</h2>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <Image
                  src="https://placehold.co/600x400.png"
                  alt="Students and alumni interacting"
                  width={600}
                  height={400}
                  className="rounded-lg shadow-xl"
                  data-ai-hint="collaboration meeting"
                />
              </div>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-accent text-accent-foreground rounded-full p-2 text-xl font-bold w-10 h-10 flex items-center justify-center">1</div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-1">Sign Up &amp; Create Profile</h3>
                    <p className="text-muted-foreground">Choose your role (Student or Alumni) and complete your profile to get started.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                   <div className="bg-accent text-accent-foreground rounded-full p-2 text-xl font-bold w-10 h-10 flex items-center justify-center">2</div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-1">Discover &amp; Connect</h3>
                    <p className="text-muted-foreground">Students can browse the alumni directory, and alumni can share posts and opportunities.</p>
                  </div>
                </div>
                 <div className="flex items-start gap-4">
                   <div className="bg-accent text-accent-foreground rounded-full p-2 text-xl font-bold w-10 h-10 flex items-center justify-center">3</div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-1">Request Mentorship</h3>
                    <p className="text-muted-foreground">Students can send mentorship requests to alumni who match their interests and goals.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-foreground text-background py-8 text-center">
        <div className="container mx-auto px-4 md:px-6">
          <p>&copy; {new Date().getFullYear()} MentorConnect. Technical Education Department, Govt. of Rajasthan. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
