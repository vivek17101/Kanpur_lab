const Sample = require("../models/Sample");

function getStatusFromTests(tests = [], fallback = "Pending") {
  if (fallback === "Reported") {
    return "Reported";
  }

  return tests.some((test) => String(test.value || "").trim().length > 0)
    ? "Tested"
    : "Pending";
}

exports.createSample = async (req, res, next) => {
  try {
    const sample = await Sample.create({
      supplierName: req.body.supplierName,
      CO: req.body.CO,
      sampleReference: req.body.sampleReference,
      dateOfSeal: req.body.dateOfSeal || undefined,
      dateReceived: req.body.dateReceived,
      dateOfTest: req.body.dateOfTest || undefined,
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
    const { search = "", status = "" } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { supplierName: { $regex: search, $options: "i" } },
        { sampleReference: { $regex: search, $options: "i" } },
        { CO: { $regex: search, $options: "i" } },
      ];
    }

    const samples = await Sample.find(filter).sort({ createdAt: -1 });
    res.json(samples);
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
