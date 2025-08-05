import express from 'express';
import ApiConfig from '../models/ApiConfig.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Create a new API config
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, baseUrl, endpoint, method, headers, body } = req.body;
    const apiConfig = await ApiConfig.create({
      userId: req.user._id,
      name,
      baseUrl,
      endpoint,
      method,
      headers,
      body
    });
    res.status(201).json({
      success: true,
      data: apiConfig
    });
  } catch (err) {
    res.status(400).json({ 
      success: false,
      message: 'Failed to create API config', 
      error: err.message 
    });
  }
});

// Get all API configs for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const configs = await ApiConfig.find({ userId: req.user._id });
    res.json({
      success: true,
      data: configs
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch API configs', 
      error: err.message 
    });
  }
});

// Update an API config
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const update = req.body;
    const config = await ApiConfig.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      update,
      { new: true }
    );
    if (!config) return res.status(404).json({ 
      success: false,
      message: 'API config not found' 
    });
    res.json({
      success: true,
      data: config
    });
  } catch (err) {
    res.status(400).json({ 
      success: false,
      message: 'Failed to update API config', 
      error: err.message 
    });
  }
});

// Delete an API config
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await ApiConfig.findOneAndDelete({ _id: id, userId: req.user._id });
    if (!result) return res.status(404).json({ 
      success: false,
      message: 'API config not found' 
    });
    res.json({ 
      success: true,
      message: 'API config deleted' 
    });
  } catch (err) {
    res.status(400).json({ 
      success: false,
      message: 'Failed to delete API config', 
      error: err.message 
    });
  }
});

export default router;