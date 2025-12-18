import { Link } from "react-router-dom";
import { Phone, MapPin, Facebook, Twitter, Instagram } from "lucide-react";

const Footer = () => {
  return (
    <footer className="glass-card mt-auto border-t border-border/20">
      <div className="container mx-auto px-4 py-6 sm:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
          {/* Brand Section */}
          <div className="space-y-2 sm:space-y-4 col-span-2 md:col-span-1">
            <h3 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Sandeep Enterprises
            </h3>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Quality groceries at best prices.
            </p>
            <div className="flex space-x-3 sm:space-x-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2 sm:space-y-4">
            <h4 className="text-sm sm:text-lg font-semibold text-foreground">Quick Links</h4>
            <ul className="space-y-1 sm:space-y-2">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-primary transition-colors text-xs sm:text-sm">
                  Products
                </Link>
              </li>
              <li>
                <Link to="/cart" className="text-muted-foreground hover:text-primary transition-colors text-xs sm:text-sm">
                  Cart
                </Link>
              </li>
              <li>
                <Link to="/compare" className="text-muted-foreground hover:text-primary transition-colors text-xs sm:text-sm">
                  Compare
                </Link>
              </li>
              <li>
                <Link to="/auth" className="text-muted-foreground hover:text-primary transition-colors text-xs sm:text-sm">
                  Account
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="space-y-2 sm:space-y-4">
            <h4 className="text-sm sm:text-lg font-semibold text-foreground">Support</h4>
            <ul className="space-y-1 sm:space-y-2">
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-xs sm:text-sm">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-xs sm:text-sm">
                  Shipping
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-xs sm:text-sm">
                  Returns
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-xs sm:text-sm">
                  Privacy
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-2 sm:space-y-4">
            <h4 className="text-sm sm:text-lg font-semibold text-foreground">Contact</h4>
            <ul className="space-y-1 sm:space-y-3">
              <li className="flex items-start gap-1 sm:gap-2 text-muted-foreground text-xs sm:text-sm">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Jagdishpur, West Champaran - 845459</span>
              </li>
              <li className="flex items-center gap-1 sm:gap-2 text-muted-foreground text-xs sm:text-sm">
                <span className="text-primary font-medium">Owner:</span>
                <span>Mantu Kumar</span>
              </li>
              <li className="flex items-center gap-1 sm:gap-2 text-muted-foreground text-xs sm:text-sm">
                <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                <a href="tel:+919661720706" className="hover:text-primary transition-colors">+91 9661720706</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border/20 mt-4 sm:mt-8 pt-4 sm:pt-8 text-center">
          <p className="text-muted-foreground text-xs sm:text-sm">
            © {new Date().getFullYear()} Sandeep Enterprises
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
