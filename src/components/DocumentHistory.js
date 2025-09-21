import React, { useState, useEffect } from 'react';
import {
    ClockIcon,
    DocumentTextIcon,
    ExclamationTriangleIcon,
    EyeIcon,
    TrashIcon
} from '@heroicons/react/24/outline';

const DocumentHistory = ({ onSelectDocument, isOpen, onClose }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        if (isOpen) {
            fetchHistory();
            fetchStats();
        }
    }, [isOpen]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const user = localStorage.getItem('user');
            console.log('🔍 Fetching document history with token:', token ? 'Present' : 'Missing');
            console.log('👤 User in localStorage:', user ? JSON.parse(user) : 'Missing');
            
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/document-history`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('📡 Document history response status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('📋 Document history data:', data);
                setHistory(data.data || []);
            } else {
                const errorData = await response.json();
                console.error('❌ Failed to fetch document history:', response.status, errorData);
            }
        } catch (error) {
            console.error('❌ Error fetching document history:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            console.log('📊 Fetching document history stats');
            
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/document-history/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('📊 Stats response status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('📊 Stats data:', data);
                setStats(data.data);
            } else {
                const errorData = await response.json();
                console.error('❌ Failed to fetch stats:', response.status, errorData);
            }
        } catch (error) {
            console.error('❌ Error fetching stats:', error);
        }
    };

    const handleViewDocument = async (documentId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/document-history/${documentId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                const document = data.data;

                let analysisData = document.fullAnalysis;
                if (typeof analysisData === 'string') {
                    try {
                        analysisData = JSON.parse(analysisData);
                    } catch (e) {
                        console.error('Error parsing analysis data:', e);
                    }
                }

                if (onSelectDocument) {
                    onSelectDocument({
                        fileName: document.fileName,
                        documentType: document.documentType,
                        summary: document.summary,
                        riskLevel: document.riskLevel,
                        redFlagsCount: document.redFlagsCount,
                        clausesCount: document.clausesCount,
                        analysisData: analysisData,
                        analysisDate: document.analysisDate
                    });
                }

                onClose();
            }
        } catch (error) {
            console.error('Error fetching document details:', error);
        }
    };

    const handleDeleteDocument = async (documentId, event) => {
        event.stopPropagation();

        if (window.confirm('Are you sure you want to delete this document from your history?')) {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${process.env.REACT_APP_API_URL}/api/document-history/${documentId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    setHistory(prev => prev.filter(doc => doc.id !== documentId));
                    fetchStats(); // Refresh stats
                }
            } catch (error) {
                console.error('Error deleting document:', error);
            }
        }
    };

    const getRiskColor = (riskLevel) => {
        switch (riskLevel?.toLowerCase()) {
            case 'high': return 'text-red-600 bg-red-100';
            case 'medium': return 'text-yellow-600 bg-yellow-100';
            case 'low': return 'text-green-600 bg-green-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-2xl font-bold text-gray-900">Document History</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                        ×
                    </button>
                </div>

                {/* Stats Section */}
                {stats && (
                    <div className="p-6 bg-gray-50 border-b">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">{stats.total_documents}</div>
                                <div className="text-sm text-gray-600">Total Documents</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-red-600">{stats.high_risk_count}</div>
                                <div className="text-sm text-gray-600">High Risk</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-yellow-600">{stats.medium_risk_count}</div>
                                <div className="text-sm text-gray-600">Medium Risk</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">{stats.low_risk_count}</div>
                                <div className="text-sm text-gray-600">Low Risk</div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="ml-2 text-gray-600">Loading history...</span>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-8">
                            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <p className="text-gray-600">No document history found</p>
                            <p className="text-sm text-gray-500 mt-2">Analyze some documents to see them here</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {history.map((document) => (
                                <div
                                    key={document.id}
                                    className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer bg-white"
                                    onClick={() => handleViewDocument(document.id)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                                                <h3 className="font-semibold text-gray-900 truncate">
                                                    {document.fileName}
                                                </h3>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(document.riskLevel)}`}>
                                                    {document.riskLevel} Risk
                                                </span>
                                            </div>

                                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                                {document.summary}
                                            </p>

                                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                                <div className="flex items-center gap-1">
                                                    <ClockIcon className="h-4 w-4" />
                                                    {formatDate(document.analysisDate)}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <ExclamationTriangleIcon className="h-4 w-4" />
                                                    {document.redFlagsCount} Red Flags
                                                </div>
                                                <div className="text-gray-400">
                                                    {document.clausesCount} Clauses
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 ml-4">
                                            <button
                                                onClick={() => handleViewDocument(document.id)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="View Document"
                                            >
                                                <EyeIcon className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={(e) => handleDeleteDocument(document.id, e)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete Document"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t bg-gray-50">
                    <div className="flex justify-between items-center">
                        <button
                            onClick={() => {
                                if (window.confirm('Are you sure you want to clear all document history?')) {
                                    // Clear all history API call
                                    const token = localStorage.getItem('token');
                                    fetch(`${process.env.REACT_APP_API_URL}/api/document-history`, {
                                        method: 'DELETE',
                                        headers: {
                                            'Authorization': `Bearer ${token}`,
                                            'Content-Type': 'application/json'
                                        }
                                    }).then(() => {
                                        setHistory([]);
                                        fetchStats();
                                    });
                                }
                            }}
                            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            Clear All History
                        </button>
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentHistory;
