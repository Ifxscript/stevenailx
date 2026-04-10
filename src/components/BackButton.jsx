import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './BackButton.css';

function BackButton() {
  return (
    <Link to="/" className="back-button" aria-label="Back to home">
      <ArrowLeft size={22} />
    </Link>
  );
}

export default BackButton;
