const Counter = require("../models/Counter");
const Sample = require("../models/Sample");

const REPORT_PREFIX = "KL";

function getStatusFromTests(tests = [], fallback = "Pending") {
  if (fallback === "Reported") {
    return "Reported";
  }

  return tests.some((test) => String(test.value || "").trim().length > 0)
    ? "Tested"
    : "Pending";
}

function getDateRangeFilter(startDate, endDate) {
  const range = {};

  if (startDate) {
    range.$gte = new Date(startDate);
  }

  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    range.$lte = end;
  }

  return Object.keys(range).length > 0 ? range : null;
}

function buildSampleFilter(query) {
  const { search = "", status = "", startDate = "", endDate = "" } = query;
  const filter = {};
  const dateRange = getDateRangeFilter(startDate, endDate);

  if (status) {
    filter.status = status;
  }

  if (dateRange) {
    filter.dateReceived = dateRange;
  }

  if (search) {
    filter.$or = [
      { reportNumber: { $regex: search, $options: "i" } },
      { sampleNo: { $regex: search, $options: "i" } },
      { supplierName: { $regex: search, $options: "i" } },
      { sampleReference: { $regex: search, $options: "i" } },
      { CO: { $regex: search, $options: "i" } },
    ];
  }

  return filter;
}

async function getNextReportNumber(dateReceived) {
  const year = dateReceived
    ? new Date(dateReceived).getFullYear()
    : new Date().getFullYear();
  const key = `sample-report-${year}`;
  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true }
  );
  const paddedSequence = String(counter.sequence).padStart(4, "0");

  return {
    reportNumber: `${REPORT_PREFIX}/${year}/${paddedSequence}`,
    reportYear: year,
    reportSequence: counter.sequence,
  };
}

exports.createSample = async (req, res, next) => {
  try {
    const reportMeta = await getNextReportNumber(req.body.dateReceived);
    const sample = await Sample.create({
      ...reportMeta,
      sampleNo: req.body.sampleNo,
      supplierName: req.body.supplierName,
      CO: req.body.CO,
      toMs: req.body.toMs,
      sampleReference: req.body.sampleReference,
      dateOfSeal: req.body.dateOfSeal || undefined,
      dateReceived: req.body.dateReceived,
      dateOfTest: req.body.dateOfTest || undefined,
      lorryNo: req.body.lorryNo,
      bags: req.body.bags,
      weight: req.body.weight,
      conditionOfSample: req.body.conditionOfSample,
      tests: req.body.tests || [],
      status: getStatusFromTests(req.body.tests || [], req.body.status),
    });

    res.status(201).json(sample);
  } catch (error) {
    next(error);
  }
};

exports.getSamples = async (req, res, next) => {
  try {
    const filter = buildSampleFilter(req.query);
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const [samples, total] = await Promise.all([
      Sample.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Sample.countDocuments(filter),
    ]);

    res.json({
      samples,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getSampleStats = async (req, res, next) => {
  try {
    const filter = buildSampleFilter({ ...req.query, status: "" });
    const [total, statusCounts] = await Promise.all([
      Sample.countDocuments(filter),
      Sample.aggregate([
        { $match: filter },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const stats = {
      total,
      Pending: 0,
      Tested: 0,
      Reported: 0,
    };

    statusCounts.forEach((item) => {
      stats[item._id] = item.count;
    });

    res.json(stats);
  } catch (error) {
    next(error);
  }
};

exports.getSampleById = async (req, res, next) => {
  try {
    const sample = await Sample.findById(req.params.id);

    if (!sample) {
      return res.status(404).json({ message: "Sample not found" });
    }

    res.json(sample);
  } catch (error) {
    next(error);
  }
};

exports.updateSample = async (req, res, next) => {
  try {
    const update = { ...req.body };

    if (Array.isArray(update.tests)) {
      update.status = getStatusFromTests(update.tests, update.status);
    }

    const sample = await Sample.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });

    if (!sample) {
      return res.status(404).json({ message: "Sample not found" });
    }

    res.json(sample);
  } catch (error) {
    next(error);
  }
};

exports.deleteSample = async (req, res, next) => {
  try {
    const sample = await Sample.findByIdAndDelete(req.params.id);

    if (!sample) {
      return res.status(404).json({ message: "Sample not found" });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
