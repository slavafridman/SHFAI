/*
 * Created on 20/01/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.utils;

import java.util.Vector;

import bzq.shf.forms.SystemParameterForm;
import bzq.utils.AppResources;
import bzq.utils.TablesContainer;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class SHFParameters {
	public static Vector getParameters(){
		AppResources appRes=AppResources.getInstance();
		TablesContainer tc=appRes.getTablesContainer();
		Vector params=tc.getTable("systemParameters");
		return params;
	}

	private static SystemParameterForm getParameter(String code,String orgUnit){
		AppResources appRes=AppResources.getInstance();
		TablesContainer tc=appRes.getTablesContainer();
		Vector params=tc.getTable("systemParameters");
		SystemParameterForm result=null;
		if(params!=null)
		for(int i=0;i<params.size();i++){
			SystemParameterForm param=(SystemParameterForm)params.get(i);
			if(param.getCode().equals(code)){
				result=param.copyParam();
				if(param.getUnitCode()!=null && param.getUnitCode().equals(orgUnit)){
					break;
				}
			}
		}
		String unitCode=result.getUnitCode();
		if(result!=null)
		if(unitCode==null || !(unitCode.equals(orgUnit))){
			result.setParamValue(null);
		}
		return result; 
	}
	
	public static SystemParameterForm getMinutesBeforeLateParam(String unit){
		return getParameter("shf.param.minutesArrivalBeforeStation",unit);
	}
	public static SystemParameterForm getLockEmployeesParam(String unit){
		return getParameter("shf.param.lockEmployees",unit);
	}
	public static SystemParameterForm getMissingNumParam(String unit){
		return getParameter("shf.param.lockMissingNum",unit);
	}
	public static SystemParameterForm getMinHoursBetweenShifts(String unit){
		return getParameter("shf.param.differenceBetweenShifts",unit);
	}
	public static SystemParameterForm getMinHoursBeforeSwitch(String unit){
		return getParameter("shf.param.hoursBeforeSwitch",unit);
	}
	public static SystemParameterForm getMaxDifferenceForSwitch(String unit) {
		return getParameter("shf.param.maximumDifferenceForSwitch",unit);
	}
	public static SystemParameterForm getMinHoursBeforeSwitchBreak(String unit){
		return getParameter("shf.param.hoursBeforeSwitchBreak",unit);
	}
	public static SystemParameterForm getMinimalShiftDuration(String unit){
		return getParameter("shf.param.minimalShiftDuration",unit);
	}
	public static SystemParameterForm getMinimalBreakLate(String unit) {
		return getParameter("shf.param.minimalBreakLate",unit);
	}
	public static SystemParameterForm getMinimalBreakShifting(String unit) {
		return getParameter("shf.param.minimalBreakShifting",unit);
	}
	public static SystemParameterForm getMaxMinutesToExitAfterEnd(String unit) {
		return getParameter("shf.param.maximumMinutesExitAfterShift",unit);
	}
	public static SystemParameterForm getMinutesBeforeReduceRequest(String unit) {
		return getParameter("shf.param.minutesBeforeReduceRequest",unit);
	}
	public static SystemParameterForm getMinutesBeforeChangeRequest(String unit) {
		return getParameter("shf.param.minutesBeforeChangeRequest",unit);
	}
	public static SystemParameterForm getMinimalShiftDurationForCR(String unit) {
		return getParameter("shf.param.minimalShiftDurationForCR",unit);
	}
	public static SystemParameterForm getMaximalShiftDuration(String unit) {
		return getParameter("shf.param.maximalShiftDurationForCR",unit);
	}
	public static SystemParameterForm getMaxToExitBeforEndShift(String unit) {
		return getParameter("shf.param.maxToExitBeforEndShift",unit);
	}	
	public static SystemParameterForm getJobsToConfirmExit(String unit) {
		return getParameter("shf.param.jobsToConfirmExit",unit);
	}
	
	public static SystemParameterForm getMinimumTimeFromLastSHift(String unit) {
		return getParameter("shf.param.minimumTimeFromLastSHift",unit);
	}
	
	public static SystemParameterForm getMinimumTimeFromNextSHift(String unit) {
		return getParameter("shf.param.minimumTimeFromNextSHift",unit);
	}
	
	public static SystemParameterForm getMaximumSelectForSwitchOffer(String unit) {
		return getParameter("shf.param.maximumSelectForSwitchOffer",unit);
	}
	public static SystemParameterForm getAgafSendSwitchOfferSMS(String unit) {
		return getParameter("shf.param.agafSendSwitchOfferSMS",unit);
	}
	public static SystemParameterForm getManagedBreakMinTimeBeforeChange(String unit) {
		return getParameter("shf.param.managedBreakMinTimeBeforeChange",unit);
	}
	public static SystemParameterForm getManagedBreakEnabled(String unit) {
		return getParameter("shf.param.managedBreakEnabled",unit);
	}
	public static SystemParameterForm getPoolEnabled(String unit) {
		return getParameter("shf.param.pool.Enabled",unit);
	}
	public static SystemParameterForm getPoolExtAllocateTimeBeforeShiftStart(String unit) {
		return getParameter("shf.param.pool.ExtAllocateTimeBeforeShiftStart",unit);
	}
	public static SystemParameterForm getPoolExtReturnTimeNoArrival(String unit) {
		return getParameter("shf.param.pool.ExtReturnTimeNoArrival",unit);
	}
	public static SystemParameterForm getPoolExtReturnTimeAfterShiftEnd(String unit) {
		return getParameter("shf.param.pool.ExtReturnTimeAfterShiftEnd",unit);
	}
	public static SystemParameterForm getIwdMinAfterShiftStart(String unit) {
		return getParameter("shf.param.iwdMinAfterShiftStart",unit);
	}
	public static SystemParameterForm getIwdMinBeforeShiftEnd(String unit) {
		return getParameter("shf.param.iwdMinBeforeShiftEnd",unit);
	}
	public static SystemParameterForm getIwdDefaultTimeToComplete(String unit) {
		return getParameter("shf.param.iwdDefaultTimeToComplete",unit);
	}
	public static SystemParameterForm getIwdRescheduleOnAgentBreak(String unit) {
		return getParameter("shf.param.iwdRescheduleOnAgentBreak",unit);
	}
	
	////cti parameters
	
	public static SystemParameterForm getMaxDiffrentBetweenSameRecType(String unit){
		return getParameter("shf.cti.param.maxDiffrentBetweenSameRecType",unit);
	}
	public static SystemParameterForm getBindingDifference(String unit){
		return getParameter("shf.cti.param.bindingDifference",unit);
	}
	public static SystemParameterForm getMaxCtiShiftLength(String unit){
		return getParameter("shf.cti.param.maxCtiShiftLength",unit);
	}
	public static SystemParameterForm getMaxDiffrentBetweenShfAndCti(String unit){
		return getParameter("shf.cti.param.maxDiffrentBetweenShfAndCti",unit);
	}
	public static SystemParameterForm getSaftyRangForProcess(String unit){
		return getParameter("shf.cti.param.saftyRangForProcess",unit);
	}
	public static SystemParameterForm getMaxCompletionLength(String unit){
		return getParameter("shf.cti.param.maxCompletionLength",unit);
	}
	public static SystemParameterForm getMinDiffBetweenCopletionAndCtiShifts(String unit){
		return getParameter("shf.cti.param.minDiffBetweenCopletionAndCtiShifts",unit);
	}
}
