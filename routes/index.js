const { catchErrors, uploadImages, verifyToken } = require('../src/service')

const fs = require('fs')
const path = require('path')
var express = require('express');
var router = express.Router();
const ItemModel = require('../models/ItemModel')
const CategoryModel = require('../models/CategoryModel')

/**
 * @swagger
 * /items:
 *   get:
 *     summary: 获取所有商品信息
 *     tags: [Item]
 *     description: Returns info of datas
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                    name: 
 *                      type: string
 *                    categoryId:
 *                      type: string
 *                    image:
 *                       type: array
 *                       items:
 *                          type: string
 */
router.get('/items', catchErrors(async (req, res) => {
  const items = await ItemModel.find();
  const reitems = items.map(item => ({
    id: item._id,
    name: item.name,
    categoryId: item.categoryId,
    image: item.imageUrl
  }))
  res.status(200).json(items)
}));

/**
 * @swagger
 * /items:
 *   post:
 *     summary: 提交物品信息
 *     tags: [Item]
 *     description: Post info of specific item
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - categoryId
 *               - image
 *             properties:
 *               name: 
 *                 type: string
 *               categoryId:
 *                 type: string 
 *               image:
 *                 type: array
 *                 items:
 *                    type: string
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                    name: 
 *                      type: string
 *                    categoryId:
 *                      type: string 
 *                    image:
 *                       type: array
 *                       items:
 *                          type: string
 */
router.post('/items', verifyToken, uploadImages, catchErrors(async (req, res) => {
  const baseUrl = path.join(__dirname, '../public/attachment')
  const imageUrls = req.files.map(file => `${baseUrl}/${file.filename}`)

  const item = new ItemModel({
    name: req.body.name,
    categoryId: req.body.categoryId,
    image: imageUrls
  })
  const newItem = await item.save()
  res.status(201).json(newItem)
}))

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: 获取所有类别信息
 *     tags: [Category]
 *     description: Fetch a list of all categories with their details.
 *     responses:
 *       200:
 *         description: Sucess
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   categoryImage:
 *                     type: array
 *                     items:
 *                        type: string
 */
router.get('/categories', catchErrors(async (req, res) => {
  const categories = await CategoryModel.find();
  res.status(200).json(categories)
}))

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: 创建一个新的类别
 *     tags: [Category]
 *     description: 添加新的类别并且上传一张类别图片
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 categoryImage:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         description: 未授权，token无效或未提供。
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Access denied. No token provided.'
 *       403:
 *         description: Token已提供但不允许访问此资源。
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Forbidden. You do not have permission to access this resource.'
 */
router.post('/categories', verifyToken, uploadImages, catchErrors(async (req, res) => {
  const existingCategory = await CategoryModel.findOne({ name: req.body.name });
  if (existingCategory) {
    req.files.forEach(file => {
      fs.unlink(path.join(__dirname, '../public/attachment', file.filename), err => {
        if (err) console.error('Error deleting file:', err);
      });
    });
    return res.status(409).json({ error: 'Category name already exists.' });
  }

  const baseUrl = path.join(__dirname, '../public/attachment')
  const imageUrls = req.files.map(file => `${baseUrl}/${file.filename}`)
  const category = new CategoryModel({
    name: req.body.name,
    categoryImage: imageUrls
  })
  const newCategory = await category.save()
  console.log(newCategory);
  res.status(201).json(newCategory);
}))

/**
 * @swagger
 * /patchcate:
 *   post:
 *     summary: 更新特定ID的类别信息及其关联的图片
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               categoryId:
 *                 type: string
 *                 description: 类别的唯一标识符
 *               name:
 *                 type: string
 *                 description: 类别的新名称
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: 类别关联的新图片
 *     responses:
 *       200:
 *         description: 类别信息更新成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Category updated successfully
 *                 category:
 *                   $ref: '#/components/schemas/Category'
 *       404:
 *         description: 类别未找到
 *       500:
 *         description: 服务器错误
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         imagePath:
 *           type: string
 *     Item:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the item
 *         name:
 *           type: string
 *           description: The name of the item
 *           unique: true
 *         categoryId:
 *           type: string
 *           description: The category ID to which the item belongs
 *         imageUrl:
 *           type: array
 *           items:
 *             type: string
 *           description: An array of URLs to images of the item
 *       example:
 *         _id: "5f8d04b3ab35f2d4a8fa6209"
 *         name: "Example Item"
 *         categoryId: "5f8cfc7a91b7f2d4a8f96209"
 *         imageUrl: ["http://example.com/image1.jpg", "http://example.com/image2.jpg"]
 * 
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the user
 *         openid:
 *           type: string
 *           description: The unique openid of the user
 *           required: true
 *           unique: true
 *         role:
 *           type: string
 *           description: The role of the user
 *           enum: [user, admin]
 *           default: 'user'
 *       example:
 *         _id: "5f8d04b3ab35f2d4a8fa6209"
 *         openid: "user123openid"
 *         role: "user"
 */
router.post('/patchcate', verifyToken, uploadImages, catchErrors(async (req, res) => {
  const categoryId = req.body.categoryid
  const { name } = req.body
  const images = req.files; // 获取上传的文件信息

  const category = await CategoryModel.findById(categoryId);
  if (!category) {
    return res.status(404).json({ message: 'Category not found' });
  }

  category.name = name || category.name;

  if (images && images.length > 0) {
    category.categoryImage = images[0].path;
  }

  await category.save();

  return res.status(200).json({ message: 'Category updated successfully', category });

}))

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: 删除指定ID的类别
 *     tags: [Category]
 *     description: 删除一个指定ID的类别，并且删除与该类别关联的所有图片文件。
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 类别的ID
 *     responses:
 *       200:
 *         description: 类别及其图片删除成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: '类别及其图片删除成功'
 *       404:
 *         description: 未找到指定ID的类别
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: '未找到类别'
 *       401:
 *         description: 未授权，token无效或未提供。
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Access denied. No token provided.'
 *       403:
 *         description: Token已提供但不允许访问此资源。
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Forbidden. You do not have permission to access this resource.'
 */
router.delete('/categories/:id', verifyToken, catchErrors(
  async (req, res) => {
    const { id } = req.params
    const category = await CategoryModel.findById(id);
    if (category) {
      category.categoryImage.forEach(file => {
        fs.unlink(path.join(file), err => {
          if (err) console.error('Error deleting file:', err);
        })
      }
      )
    }

    const result = await CategoryModel.deleteOne({ _id: id });
    if (result.deletedCount === 1) {
      res.status(200).json({ message: '类别删除成功' })
    } else {
      res.status(404).json({ message: '未找到类别' })
    }
  }
))

/**
 * @swagger
 * /categories/{id}:
 *   post:
 *     summary: 在特定类别上传商品
 *     tags: [Category]
 *     description: >
 *       创建一个新的条目，并上传与之相关的图片。如果条目名称已存在，则拒绝创建并删除上传的图片。
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 类别的ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 条目的名称
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: 要上传的图片
 *     responses:
 *       201:
 *         description: 条目创建成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Item'
 *       409:
 *         description: 条目名称已存在
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: 'Category name already exists.'
 *       401:
 *         description: 未授权，token无效或未提供
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Access denied. No token provided.'
 *       403:
 *         description: Token已提供但不允许访问此资源
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Forbidden. You do not have permission to access this resource.'
 * components:
 *   schemas:
 *     Item:
 *       type: object
 *       required:
 *         - name
 *         - categoryId
 *         - image
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         categoryId:
 *           type: string
 *         image:
 *           type: array
 *           items:
 *             type: string
 */
router.post('/categories/:id', verifyToken, uploadImages, catchErrors(async (req, res) => {
  const existingItem = await ItemModel.findOne({ name: req.body.name })
  if (existingItem) {
    req.files.forEach(file => {
      fs.unlink(path.join(file.path), err => {
        if (err) console.error('Error deleting file:', err);
      })
    })
    return res.status(409).json({ error: 'Category name already exists.' })
  }

  const baseUrl = path.join(__dirname, '../public/attachment')
  const imageUrls = req.files.map(file => `${baseUrl}/${file.filename}`)

  const item = new ItemModel({
    name: req.body.name,
    categoryId: req.params.id,
    imageUrl: imageUrls
  })

  const newItem = await item.save()
  res.status(201).json(newItem)
}))

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: 获取特定类别的所有商品
 *     tags: [Item]
 *     description: 根据类别ID，返回该类别下所有条目的列表。
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 类别的ID
 *     responses:
 *       200:
 *         description: 成功获取条目列表
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: 条目的唯一标识符
 *                   name:
 *                     type: string
 *                     description: 条目的名称
 *                   categoryId:
 *                     type: string
 *                     description: 条目所属的类别ID
 *                   image:
 *                     type: string
 *                     description: 条目的图片URL
 *       404:
 *         description: 未找到条目
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'No items found for the specified category ID.'
 */
router.get('/categories/:id', catchErrors(async (req, res) => {
  const categoryId = req.params.id;
  const items = await ItemModel.find({ categoryId: categoryId });
  const reitems = items.map(item => ({
    id: item._id,
    name: item.name,
    categoryId: item.categoryId,
    image: item.imageUrl
  }));

  res.status(200).json(reitems);
}))

/**
 * @swagger
 * /items/{id}:
 *   delete:
 *     summary: 删除指定商品
 *     tags: [Item]
 *     description: 删除一个指定ID的条目，并尝试删除与该条目关联的所有图片文件。
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 条目的ID
 *     responses:
 *       200:
 *         description: 条目删除成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Item deleted successfully
 *       404:
 *         description: 未找到条目
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Item not found
 *       401:
 *         description: 未授权，token无效或未提供
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Access denied. No token provided.
 *       403:
 *         description: Token已提供但不允许访问此资源
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Forbidden. You do not have permission to access this resource.
 */
router.delete('/items/:id', verifyToken, catchErrors(async (req, res) => {
  const { id } = req.params;
  const item = await ItemModel.findByIdAndDelete(id);

  if (item) {
    console.log(item.imageUrl);
    item.imageUrl.forEach(file => {
      fs.unlink(path.join(file), err => {
        if (err) console.error('Error deleting file:', err);
      })
    }
    )
  }
  if (!item) {
    return res.status(404).send({ error: 'Item not found' });
  }
  res.send({ message: 'Item deleted successfully' });
}))



// let filePath = '/Users/mac/Desktop/proj/public/attachment/1709557602709-eTw2ebGhZrL7b8c87172f603e42a9082b42588634ca6.jpg'
// // 检查文件是否存在
// if (fs.existsSync(filePath)) {
//   // 尝试删除文件
//   console.log('file');
// } else {
//   console.log('File does not exist:', filePath);
// }


module.exports = router;
