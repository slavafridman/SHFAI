package bzq.shf.bean;

import java.util.Date;
import java.util.HashMap;
import java.util.Vector;

public class ForecastSchedualBean extends ShfBaseBean{
	
	protected static HashMap fieldsMapping = null;
	static {
		fieldsMapping = new HashMap();
		fieldsMapping.put("", "time");
		fieldsMapping.put("", "tekhnonMaty");
		fieldsMapping.put("", "requiredStaffing");
		fieldsMapping.put("", "shebotsMoked");
		fieldsMapping.put("", "breakExcepWFM");
		fieldsMapping.put("", "breakExcepSHF");
		fieldsMapping.put("", "exceptionsWFM");
		fieldsMapping.put("", "exceptionsWFMDetails");
		fieldsMapping.put("", "exceptionsSHF");
		fieldsMapping.put("", "exceptionsSHFDetails");
		fieldsMapping.put("", "arrivals");
		fieldsMapping.put("", "arrivalsDetails");
		fieldsMapping.put("", "afterChanges");
		fieldsMapping.put("", "inExtraHours");
		fieldsMapping.put("", "notMarked");
		fieldsMapping.put("", "marked");
		fieldsMapping.put("", "markedDetails");
		fieldsMapping.put("", "missing");
		fieldsMapping.put("", "missingDetails");
		fieldsMapping.put("", "late");
		fieldsMapping.put("", "lateDetails");
		fieldsMapping.put("", "cancelled");
		fieldsMapping.put("", "futureExit");
		fieldsMapping.put("", "futureExitDetails");
		fieldsMapping.put("", "sum");
		fieldsMapping.put("", "difference");
		fieldsMapping.put("", "toShow");
	}
	
	public HashMap getFieldsMapping() {
		return fieldsMapping;
	}
	
	private Date time;
	private int tekhnonMaty;
	private int requiredStaffing;
	private int shebotsMoked;
	private double breakExcepWFM;
	private double breakExcepSHF;
	private double exceptionsWFM;
	private Vector exceptionsWFMDetails;
	private double exceptionsSHF;
	private Vector exceptionsSHFDetails;
	private Vector<ExceptionSearchBean> exceptionsSHFDetailsBean;
	
//	private int arrivals;
	private double arrivals;
	
	private Vector arrivalsDetails;
	
//	private int afterChanges;
	private double afterChanges;
	
//	private int inExtraHours;
	private double inExtraHours;
	
//	private int notMarked;
//	private int marked;
	private double notMarked;
	private double marked;
	
	private Vector markedDetails;
	private double missing;
	private Vector missingDetails;
	private double late;
	private Vector lateDetails;
	private double cancelled;
	
//	private int futureExit;
	private double futureExit;
	
	private Vector futureExitDetails;
	private int sum;
	private int difference;
	private boolean toShow;
	private double extension;
	private double shortening;
	private double shifting;
	private Vector extensionDetails;
	private Vector shorteningDetails;
	private Vector shiftingDetails;
	private Vector cancelDetails;
	private Vector extraDetails;
	private Vector<AgentDayBean> VecMokedSwitchesLeft;
	private Vector<AgentDayBean> VecMokedSwitchesArrived;
	
	

	
	public double getAfterChanges() {
		return afterChanges;
	}
	public void setAfterChanges(double afterChanges) {
		this.afterChanges = afterChanges;
	}
	public double getInExtraHours() {
		return inExtraHours;
	}
	public void setInExtraHours(double inExtraHours) {
		this.inExtraHours = inExtraHours;
	}
	public double getNotMarked() {
		return notMarked;
	}
	public void setNotMarked(double notMarked) {
		this.notMarked = notMarked;
	}
	public double getMarked() {
		return marked;
	}
	public void setMarked(double marked) {
		this.marked = marked;
	}
	public double getArrivals() {
		return arrivals;
	}
	public void setArrivals(double arrivals) {
		this.arrivals = arrivals;
	}
	public double getFutureExit() {
		return futureExit;
	}
	public void setFutureExit(double futureExit) {
		this.futureExit = futureExit;
	}
	
	
	public Date getTime() {
		return time;
	}
	public void setTime(Date time) {
		this.time = time;
	}
	public int getTekhnonMaty() {
		return tekhnonMaty;
	}
	public void setTekhnonMaty(int tekhnonMaty) {
		this.tekhnonMaty = tekhnonMaty;
	}
	public int getRequiredStaffing() {
		return requiredStaffing;
	}
	public void setRequiredStaffing(int requiredStaffing) {
		this.requiredStaffing = requiredStaffing;
	}
	public int getShebotsMoked() {
		return shebotsMoked;
	}
	public void setShebotsMoked(int shebotsMoked) {
		this.shebotsMoked = shebotsMoked;
	}
	public double getBreakExcepWFM() {
		return breakExcepWFM;
	}
	public void setBreakExcepWFM(double breakExcepWFM) {
		this.breakExcepWFM = breakExcepWFM;
	}
	public double getBreakExcepSHF() {
		return breakExcepSHF;
	}
	public void setBreakExcepSHF(double breakExcepSHF) {
		this.breakExcepSHF = breakExcepSHF;
	}
	public double getExceptionsWFM() {
		return exceptionsWFM;
	}
	public void setExceptionsWFM(double exceptionsWFM) {
		this.exceptionsWFM = exceptionsWFM;
	}
	public Vector getExceptionsWFMDetails() {
		return exceptionsWFMDetails;
	}
	public void setExceptionsSHFDetailsBean(Vector<ExceptionSearchBean> exceptionsSHFDetailsBean) {
		this.exceptionsSHFDetailsBean = exceptionsSHFDetailsBean;
	}
	public Vector<ExceptionSearchBean> getExceptionsSHFDetailsBean() {
		return exceptionsSHFDetailsBean;
	}
	public void setExceptionsWFMDetails(Vector exceptionsWFMDetails) {
		this.exceptionsWFMDetails = exceptionsWFMDetails;
	}
	public double getExceptionsSHF() {
		return exceptionsSHF;
	}
	public void setExceptionsSHF(double exceptionsSHF) {
		this.exceptionsSHF = exceptionsSHF;
	}
	public Vector getExceptionsSHFDetails() {
		return exceptionsSHFDetails;
	}
	public void setExceptionsSHFDetails(Vector exceptionsSHFDetails) {
		this.exceptionsSHFDetails = exceptionsSHFDetails;
	}
	public Vector getArrivalsDetails() {
		return arrivalsDetails;
	}
	public void setArrivalsDetails(Vector arrivalsDetails) {
		this.arrivalsDetails = arrivalsDetails;
	}
	public Vector getMarkedDetails() {
		return markedDetails;
	}
	public void setMarkedDetails(Vector markedDetails) {
		this.markedDetails = markedDetails;
	}
	public double getMissing() {
		return missing;
	}
	public void setMissing(double missing) {
		this.missing = missing;
	}
	public Vector getMissingDetails() {
		return missingDetails;
	}
	public void setMissingDetails(Vector missingDetails) {
		this.missingDetails = missingDetails;
	}
	public double getLate() {
		return late;
	}
	public void setLate(double late) {
		this.late = late;
	}
	public Vector getLateDetails() {
		return lateDetails;
	}
	public void setLateDetails(Vector lateDetails) {
		this.lateDetails = lateDetails;
	}
	public double getCancelled() {
		return cancelled;
	}
	public void setCancelled(double cancelled) {
		this.cancelled = cancelled;
	}
	public Vector getFutureExitDetails() {
		return futureExitDetails;
	}
	public void setFutureExitDetails(Vector futureExitDetails) {
		this.futureExitDetails = futureExitDetails;
	}
	public int getSum() {
		return sum;
	}
	public void setSum(int sum) {
		this.sum = sum;
	}
	public int getDifference() {
		return difference;
	}
	public void setDifference(int difference) {
		this.difference = difference;
		
	}
	
	public double getExtension() {
		return extension;
	}
	public void setExtension(double extension) {
		this.extension = extension;
	}
	public double getShortening() {
		return shortening;
	}
	public void setShortening(double shortening) {
		this.shortening = shortening;
	}
	public double getShifting() {
		return shifting;
	}
	public void setShifting(double shifting) {
		this.shifting = shifting;
	}
	
	public Vector getExtensionDetails() {
		return extensionDetails;
	}
	public void setExtensionDetails(Vector extensionDetails) {
		this.extensionDetails = extensionDetails;
	}
	public Vector getShorteningDetails() {
		return shorteningDetails;
	}
	public void setShorteningDetails(Vector shorteningDetails) {
		this.shorteningDetails = shorteningDetails;
	}
	public Vector getShiftingDetails() {
		return shiftingDetails;
	}
	public void setShiftingDetails(Vector shiftingDetails) {
		this.shiftingDetails = shiftingDetails;
	}
	
	public Vector getCancelDetails() {
		return cancelDetails;
	}
	public void setCancelDetails(Vector cancelDetails) {
		this.cancelDetails = cancelDetails;
	}
	public Vector getExtraDetails() {
		return extraDetails;
	}
	public void setExtraDetails(Vector extraDetails) {
		this.extraDetails = extraDetails;
	}
	public boolean getToShow() {
		double sumAll = tekhnonMaty + requiredStaffing + shebotsMoked + breakExcepWFM + breakExcepSHF + exceptionsWFM + exceptionsSHF
		                + arrivals + afterChanges + inExtraHours + notMarked + marked + missing + late + cancelled + futureExit + sum;
		
		return (sumAll==0?false:true);
	}
	public void setToShow(boolean toShow) {
		this.toShow = toShow;
	}
	
	public void setVecMokedSwitchesArrived(Vector<AgentDayBean> vecMokedSwitchesArrived) {
		this.VecMokedSwitchesArrived = vecMokedSwitchesArrived;
	}
	public Vector<AgentDayBean> getVecMokedSwitchesArrived() {
		return VecMokedSwitchesArrived;
	}
	public Vector<AgentDayBean> getVecMokedSwitchesLeft() {
		return VecMokedSwitchesLeft;
	}
	public void setVecMokedSwitchesLeft(Vector<AgentDayBean> vecMokedSwitchesLeft) {
		VecMokedSwitchesLeft = vecMokedSwitchesLeft;
	}


	
	
}
