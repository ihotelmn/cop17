"use client"
import React from 'react';
export class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error("CAUGHT ERROR:", error, info); }
  render() { if (this.state.hasError) return <div className="p-4 text-red-500 overflow-auto text-xs">{this.state.error.toString()}</div>; return this.props.children; }
}
