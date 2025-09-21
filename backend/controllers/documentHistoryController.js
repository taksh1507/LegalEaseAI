const pool = require('../config/database');

class DocumentHistoryController {
  // Create new document history entry
  static async createHistory(req, res) {
    console.log('📝 createHistory called for user:', req.user?.email);
    console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
    
    if (!pool) {
      console.log('❌ Database not configured');
      return res.status(503).json({
        success: false,
        message: 'Database not configured'
      });
    }

    try {
      const { 
        fileName, 
        documentType, 
        summary, 
        riskLevel, 
        redFlagsCount, 
        clausesCount, 
        analysisData 
      } = req.body;

      const userEmail = req.user?.email;
      if (!userEmail) {
        console.log('❌ No user email found in request');
        return res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
      }

      console.log('💾 Saving document history for user:', userEmail);

      const query = `
        INSERT INTO document_history 
        (user_email, file_name, document_type, summary, risk_level, red_flags_count, clauses_count, analysis_data)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, analysis_date
      `;

      const values = [
        userEmail,
        fileName,
        documentType || 'Unknown Document',
        summary || '',
        riskLevel || 'Low',
        redFlagsCount || 0,
        clausesCount || 0,
        JSON.stringify(analysisData)
      ];

      console.log('💾 Executing query with values:', values.slice(0, -1)); // Don't log the full analysis data

      const result = await pool.query(query, values);
      
      console.log('✅ Document history saved with ID:', result.rows[0].id);

      res.json({
        success: true,
        data: {
          id: result.rows[0].id,
          analysisDate: result.rows[0].analysis_date
        },
        message: 'Document history saved successfully'
      });

    } catch (error) {
      console.error('❌ Error creating document history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save document history',
        error: error.message
      });
    }
  }

  // Get user's document history
  static async getUserHistory(req, res) {
    console.log('📋 getUserHistory called for user:', req.user?.email);
    console.log('📋 Full user object:', req.user);
    
    if (!pool) {
      console.log('❌ Database not configured');
      return res.status(503).json({
        success: false,
        message: 'Database not configured'
      });
    }

    try {
      const userEmail = req.user?.email;
      if (!userEmail) {
        console.log('❌ No user email found in request');
        console.log('❌ Available user data:', req.user);
        return res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
      }

      console.log('🔍 Fetching document history for user:', userEmail);
      
      // Debug: Check what emails exist in the database
      const allEmails = await pool.query('SELECT DISTINCT user_email FROM document_history LIMIT 10');
      console.log('📧 Available emails in database:', allEmails.rows.map(r => r.user_email));

      const limit = parseInt(req.query.limit) || 10;
      const offset = parseInt(req.query.offset) || 0;

      const query = `
        SELECT 
          id,
          file_name,
          document_type,
          summary,
          risk_level,
          red_flags_count,
          clauses_count,
          analysis_data,
          analysis_date,
          created_at
        FROM document_history
        WHERE user_email = $1
        ORDER BY analysis_date DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await pool.query(query, [userEmail, limit, offset]);
      console.log('📊 Query result:', result.rows.length, 'documents found');
      
      const history = result.rows.map(row => ({
        id: row.id,
        fileName: row.file_name,
        documentType: row.document_type,
        summary: row.summary,
        riskLevel: row.risk_level,
        redFlagsCount: row.red_flags_count,
        clausesCount: row.clauses_count,
        analysisDate: row.analysis_date,
        createdAt: row.created_at,
        fullAnalysis: row.analysis_data
      }));

      console.log('✅ Sending document history response:', history.length, 'items');

      res.json({
        success: true,
        data: history,
        total: result.rows.length
      });

    } catch (error) {
      console.error('❌ Error fetching document history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch document history',
        error: error.message
      });
    }
  }

  // Get specific document history entry
  static async getHistoryById(req, res) {
    if (!pool) {
      return res.status(503).json({
        success: false,
        message: 'Database not configured'
      });
    }

    try {
      const { id } = req.params;
      const userEmail = req.user?.email;

      if (!userEmail) {
        return res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
      }

      const query = `
        SELECT 
          id,
          file_name,
          document_type,
          summary,
          risk_level,
          red_flags_count,
          clauses_count,
          analysis_data,
          analysis_date,
          created_at
        FROM document_history
        WHERE id = $1 AND user_email = $2
      `;

      const result = await pool.query(query, [id, userEmail]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Document history not found'
        });
      }

      const row = result.rows[0];
      const historyEntry = {
        id: row.id,
        fileName: row.file_name,
        documentType: row.document_type,
        summary: row.summary,
        riskLevel: row.risk_level,
        redFlagsCount: row.red_flags_count,
        clausesCount: row.clauses_count,
        analysisDate: row.analysis_date,
        createdAt: row.created_at,
        fullAnalysis: row.analysis_data
      };

      res.json({
        success: true,
        data: historyEntry
      });

    } catch (error) {
      console.error('❌ Error fetching document history by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch document history'
      });
    }
  }

  // Delete specific document history entry
  static async deleteHistory(req, res) {
    if (!pool) {
      return res.status(503).json({
        success: false,
        message: 'Database not configured'
      });
    }

    try {
      const { id } = req.params;
      const userEmail = req.user?.email;

      if (!userEmail) {
        return res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
      }

      const query = `
        DELETE FROM document_history
        WHERE id = $1 AND user_email = $2
        RETURNING id
      `;

      const result = await pool.query(query, [id, userEmail]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Document history not found'
        });
      }

      res.json({
        success: true,
        message: 'Document history deleted successfully'
      });

    } catch (error) {
      console.error('❌ Error deleting document history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete document history'
      });
    }
  }

  // Clear all user's document history
  static async clearUserHistory(req, res) {
    if (!pool) {
      return res.status(503).json({
        success: false,
        message: 'Database not configured'
      });
    }

    try {
      const userEmail = req.user?.email;
      if (!userEmail) {
        return res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
      }

      const query = `
        DELETE FROM document_history
        WHERE user_email = $1
        RETURNING COUNT(*) as deleted_count
      `;

      const result = await pool.query(query, [userEmail]);
      
      res.json({
        success: true,
        message: 'All document history cleared successfully',
        deletedCount: result.rowCount
      });

    } catch (error) {
      console.error('❌ Error clearing document history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clear document history'
      });
    }
  }

  // Get user's document history stats
  static async getHistoryStats(req, res) {
    if (!pool) {
      return res.status(503).json({
        success: false,
        message: 'Database not configured'
      });
    }

    try {
      const userEmail = req.user?.email;
      if (!userEmail) {
        return res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
      }

      const query = `
        SELECT 
          COUNT(*) as total_documents,
          COUNT(CASE WHEN risk_level = 'High' THEN 1 END) as high_risk_count,
          COUNT(CASE WHEN risk_level = 'Medium' THEN 1 END) as medium_risk_count,
          COUNT(CASE WHEN risk_level = 'Low' THEN 1 END) as low_risk_count,
          MAX(analysis_date) as last_analysis
        FROM document_history
        WHERE user_email = $1
      `;

      const result = await pool.query(query, [userEmail]);
      
      res.json({
        success: true,
        data: result.rows[0]
      });

    } catch (error) {
      console.error('❌ Error fetching document history stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch document history stats'
      });
    }
  }
}

module.exports = DocumentHistoryController;