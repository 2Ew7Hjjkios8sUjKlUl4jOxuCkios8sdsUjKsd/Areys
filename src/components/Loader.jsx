import React from 'react';
import { Plane, Loader2 } from 'lucide-react';
import '../App.css'; // Ensure we have access to global styles/animations

const Loader = ({ fullScreen = false, text = 'Loading...', type = 'plane' }) => {
    if (fullScreen) {
        return (
            <div className="loader-overlay">
                <div className="loader-content">
                    {type === 'plane' ? (
                        <div className="plane-loader">
                            <Plane size={48} className="animate-fly" />
                        </div>
                    ) : (
                        <Loader2 size={48} className="animate-spin text-primary" />
                    )}
                    <h3 className="loader-text">{text}</h3>
                </div>
            </div>
        );
    }

    return (
        <div className="loader-inline">
            <Loader2 size={20} className="animate-spin" />
            {text && <span className="ml-2">{text}</span>}
        </div>
    );
};

export default Loader;
