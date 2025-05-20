import { Facebook, Github, Instagram, Mail, Phone, Twitter } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto py-8 px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">FatteCentralen A/S</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Din platform for sport, aktier og fællesskab.
            </p>
            <div className="flex flex-col space-y-2 text-sm">
              <a href="mailto:info@fattecentralen.dk" className="flex items-center text-muted-foreground hover:text-primary">
                <Mail className="mr-2 h-4 w-4" /> info@fattecentralen.dk
              </a>
              <a href="tel:+4512345678" className="flex items-center text-muted-foreground hover:text-primary">
                <Phone className="mr-2 h-4 w-4" /> +45 12 34 56 78
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/live-sports" className="text-muted-foreground hover:text-primary">Live Sports</Link></li>
              <li><Link href="/aktiedyst" className="text-muted-foreground hover:text-primary">Aktiedyst</Link></li>
              <li><Link href="/forum" className="text-muted-foreground hover:text-primary">Forum</Link></li>
              <li><Link href="/leaderboard" className="text-muted-foreground hover:text-primary">Leaderboard</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Information</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="text-muted-foreground hover:text-primary">Om Os</Link></li>
              <li><Link href="/faq" className="text-muted-foreground hover:text-primary">FAQ</Link></li>
              <li><Link href="/contact" className="text-muted-foreground hover:text-primary">Kontakt</Link></li>
              <li><Link href="/careers" className="text-muted-foreground hover:text-primary">Karriere</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Juridisk</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/terms" className="text-muted-foreground hover:text-primary">Betingelser</Link></li>
              <li><Link href="/privacy" className="text-muted-foreground hover:text-primary">Privatlivspolitik</Link></li>
              <li><Link href="/cookies" className="text-muted-foreground hover:text-primary">Cookie Politik</Link></li>
              <li><Link href="/gdpr" className="text-muted-foreground hover:text-primary">GDPR Information</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground mb-4 md:mb-0">
              &copy; {currentYear} FatteCentralen A/S. Alle rettigheder forbeholdes.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-primary" aria-label="Twitter">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary" aria-label="Facebook">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary" aria-label="Instagram">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary" aria-label="GitHub">
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
