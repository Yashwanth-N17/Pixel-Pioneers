const incomeSourceService = require("./incomeSource.service");
const { sendSuccess } = require("../../utils/apiResponse");

const createIncomeSource = async (req, res, next) => {
  try {
    const incomeSource = await incomeSourceService.createIncomeSource(req.user.id, req.body);
    return sendSuccess(res, "Income source created successfully.", incomeSource, 201);
  } catch (error) {
    next(error);
  }
};

const getIncomeSourcesByUser = async (req, res, next) => {
  try {
    const incomeSources = await incomeSourceService.getIncomeSourcesByUser(
      req.user.id,
      req.params.userId
    );
    return sendSuccess(res, "Income sources fetched successfully.", incomeSources);
  } catch (error) {
    next(error);
  }
};

const updateIncomeSource = async (req, res, next) => {
  try {
    const incomeSource = await incomeSourceService.updateIncomeSource(
      req.user.id,
      req.params.id,
      req.body
    );
    return sendSuccess(res, "Income source updated successfully.", incomeSource);
  } catch (error) {
    next(error);
  }
};

const deleteIncomeSource = async (req, res, next) => {
  try {
    await incomeSourceService.deleteIncomeSource(req.user.id, req.params.id);
    return sendSuccess(res, "Income source deleted successfully.", null);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createIncomeSource,
  getIncomeSourcesByUser,
  updateIncomeSource,
  deleteIncomeSource,
};
