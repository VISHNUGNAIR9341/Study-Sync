import React, { useState, useEffect } from 'react';
import { Database, Table, X, ChevronRight, Search } from 'lucide-react';
import axios from 'axios';

const DatabaseViewer = ({ onClose }) => {
    const [tables, setTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState(null);
    const [schema, setSchema] = useState([]);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ limit: 50, offset: 0, total: 0 });

    useEffect(() => {
        fetchTables();
    }, []);

    const fetchTables = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/database/tables');
            setTables(response.data || []);
        } catch (error) {
            console.error('Error fetching tables:', error);
        }
    };

    const selectTable = async (tableName) => {
        setSelectedTable(tableName);
        setLoading(true);

        try {
            // Fetch schema
            const schemaResponse = await axios.get(`http://localhost:5000/api/database/tables/${tableName}/schema`);
            setSchema(schemaResponse.data || []);

            // Fetch data
            const dataResponse = await axios.get(`http://localhost:5000/api/database/tables/${tableName}/data?limit=50&offset=0`);
            setData(dataResponse.data.data || []);
            setPagination({
                limit: dataResponse.data.limit,
                offset: dataResponse.data.offset,
                total: dataResponse.data.total
            });
        } catch (error) {
            console.error('Error fetching table data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadMore = async () => {
        if (!selectedTable) return;

        const newOffset = pagination.offset + pagination.limit;
        setLoading(true);

        try {
            const response = await axios.get(
                `http://localhost:5000/api/database/tables/${selectedTable}/data?limit=${pagination.limit}&offset=${newOffset}`
            );
            setData(response.data.data || []);
            setPagination({
                limit: response.data.limit,
                offset: response.data.offset,
                total: response.data.total
            });
        } catch (error) {
            console.error('Error loading more data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                            <Database className="text-blue-600 dark:text-blue-400" size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-gray-100">Database Viewer</h2>
                            <p className="text-sm text-slate-500 dark:text-gray-400">Inspect your application database (Read-only)</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X className="text-gray-600 dark:text-gray-400" size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex">
                    {/* Table List Sidebar */}
                    <div className="w-64 border-r border-slate-200 dark:border-gray-700 p-4 overflow-y-auto bg-slate-50 dark:bg-gray-900">
                        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                            <Table size={16} />
                            Tables ({tables.length})
                        </h3>
                        <div className="space-y-2">
                            {tables.map((table) => (
                                <button
                                    key={table.table_name}
                                    onClick={() => selectTable(table.table_name)}
                                    className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center justify-between ${selectedTable === table.table_name
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <span className="font-medium text-sm">{table.table_name}</span>
                                    <ChevronRight size={16} />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Table Details */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {!selectedTable ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <Database size={64} className="mb-4 opacity-50" />
                                <p className="text-lg">Select a table to view its contents</p>
                            </div>
                        ) : loading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Schema Section */}
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3">Schema</h3>
                                    <div className="bg-slate-50 dark:bg-gray-900 rounded-lg overflow-hidden border border-slate-200 dark:border-gray-700">
                                        <table className="w-full">
                                            <thead className="bg-gray-100 dark:bg-gray-800">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Column</th>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Type</th>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Nullable</th>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Default</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {schema.map((col, index) => (
                                                    <tr key={index} className="border-t border-gray-200 dark:border-gray-700">
                                                        <td className="px-4 py-2 text-sm font-mono text-gray-800 dark:text-gray-200">{col.column_name}</td>
                                                        <td className="px-4 py-2 text-sm text-blue-600 dark:text-blue-400">{col.data_type}</td>
                                                        <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{col.is_nullable}</td>
                                                        <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 font-mono">{col.column_default || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Data Section */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                                            Data ({pagination.total} rows)
                                        </h3>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            Showing {pagination.offset + 1} - {Math.min(pagination.offset + pagination.limit, pagination.total)}
                                        </span>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-gray-900 rounded-lg overflow-x-auto border border-slate-200 dark:border-gray-700">
                                        <table className="w-full">
                                            <thead className="bg-gray-100 dark:bg-gray-800">
                                                <tr>
                                                    {schema.map((col) => (
                                                        <th key={col.column_name} className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                                            {col.column_name}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.map((row, rowIndex) => (
                                                    <tr key={rowIndex} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">
                                                        {schema.map((col) => (
                                                            <td key={col.column_name} className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 font-mono max-w-xs truncate">
                                                                {row[col.column_name] !== null && row[col.column_name] !== undefined
                                                                    ? typeof row[col.column_name] === 'object'
                                                                        ? JSON.stringify(row[col.column_name])
                                                                        : String(row[col.column_name])
                                                                    : '-'}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    {pagination.total > pagination.offset + pagination.limit && (
                                        <div className="mt-4 flex justify-center">
                                            <button
                                                onClick={loadMore}
                                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                            >
                                                Load More
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DatabaseViewer;
