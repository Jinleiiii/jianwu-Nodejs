var express = require('express');
var router = express.Router();
const { catchErrors, verifyToken } = require('../src/service')
var { JWT_SECRET_KEY, appid, appsecret } = require('../config/wxappConfig')
var WXBizDataCrypt = require('./WXBizDataCrypt')
const { default: axios } = require('axios');
const jwt = require('jsonwebtoken')
const UserModel = require('../models/UserModel');

/* GET users listing. */
router.get('/login', catchErrors(async (req, res) => {

})

);


/**
 * @swagger
 * /login:
 *   post:
 *     summary: 用户登录接口
 *     description: 通过微信小程序发送的code、iv、encryptedData进行登录，返回用户数据和JWT令牌。
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - iv
 *               - encryptedData
 *             properties:
 *               code:
 *                 type: string
 *                 description: 微信小程序登录时获取的code
 *               iv:
 *                 type: string
 *                 description: 加密算法的初始向量
 *               encryptedData:
 *                 type: string
 *                 description: 包含用户信息的加密数据
 *     responses:
 *       200:
 *         description: 登录成功，返回用户数据和JWT令牌
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: login success
 *                 userdata:
 *                   type: object
 *                   properties:
 *                     openid:
 *                       type: string
 *                     nickName:
 *                       type: string
 *                     gender:
 *                       type: string
 *                     city:
 *                       type: string
 *                     province:
 *                       type: string
 *                     country:
 *                       type: string
 *                     avatarUrl:
 *                       type: string
 *                 token:
 *                   type: string
 *                   description: JWT令牌
 *                 role:
 *                   type: string
 *                   description: 用户角色（admin/user）
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器内部错误
 */
router.post('/login', catchErrors(async (req, res) => {
  const { iv, code, encryptedData } = req.body;

  let wxURl = `https://api.weixin.qq.com/sns/jscode2session?grant_type=authorization_code&appid=${appid}&secret=${appsecret}&js_code=${code}`;

  const response = await axios.get(wxURl)
  const { openid, session_key } = response.data;

  var pc = new WXBizDataCrypt(appid, session_key)
  var userdata = pc.decryptData(encryptedData, iv)

  const payload = {
    openid
  }
  const token = jwt.sign(payload, JWT_SECRET_KEY, {
    expiresIn: '1h'
  })

  let user = await UserModel.findOne({ openid: openid })
  if (!user) {
    user = new UserModel({ openid: openid })
    await user.save()
  }
  const role = (openid === 'ocuyq6y0CGlghzBS-q4fp-m17XJ8') ? 'admin' : 'user';

  res.status(200).json({
    message: 'login success',
    userdata,
    token,
    role
  })
})
);

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:            # arbitrary name for the security scheme
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT    # optional, arbitrary value for documentation purposes
 * 
 * /auth:
 *   get:
 *     summary: 验证用户登录状态
 *     description: 需要提供有效的JWT令牌来验证用户是否已登录。
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 已登录，返回验证消息。
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: '已登录'
 *       401:
 *         description: 未授权，token无效或已过期。
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Access denied. No token provided.' # 或 'Token expired.' 根据实际错误调整
 *       400:
 *         description: 请求中的token无效。
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Invalid token.'
 */
router.get('/auth', verifyToken, (req, res) => {
  res.send('已登录');
});

module.exports = router;