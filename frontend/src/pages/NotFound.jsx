import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => (
  <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 text-center">
    <p className="font-display font-bold text-6xl text-amber mb-2">404</p>
    <p className="text-chalk font-medium mb-1">This page wandered off.</p>
    <p className="text-muted text-sm mb-6">Even peer learning can't help with this one.</p>
    <Link to="/" className="btn-primary">
      Back to SkillBridge
    </Link>
  </div>
);

export default NotFound;
