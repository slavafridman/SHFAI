/*
 * Created on 07/01/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.forms;

import java.util.Date;
import java.util.Vector;

import org.apache.struts.upload.FormFile;

import bzq.shf.bean.ShiftTreeNodeBean;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class ShiftDataForm extends AttendanceSearchForm{
	protected String cbChecked;
	protected String currentTime;
	protected ShiftTreeNodeBean tree;
	protected Date newStartDate;
	protected String newStartTime;
	protected Date newEndDate;
	protected String newEndTime;
	protected String newStartStatusForUpdate;
	protected String newEndStatusForUpdate;
	protected String mokedForCheck;
	protected boolean cancelBreakSwitch;
	protected Vector<bzq.shf.forms.OrgUnitTableForm> myAgafMokedUnits;
	protected boolean isSwitchPotential;
	protected String shiftLocation;
	protected FormFile shiftsFile;
	protected String newSplitStartTime;
	protected String newSplitEndTime;
	protected String shiftExtNum;
	
	/* (non-Javadoc)
	 * @see bzq.shf.bean.ShfBaseBean#getFieldsMapping()
	 */
	
	

	/**
	 * @return
	 */
	public String getCurrentTime() {
		return currentTime;
	}

	/**
	 * @param string
	 */
	public void setCurrentTime(String string) {
		currentTime = string;
	}

	

	/**
	 * @return
	 */
	public String getCbChecked() {
		return cbChecked;
	}

	/**
	 * @param string
	 */
	public void setCbChecked(String string) {
		cbChecked = string;
	}


	
	/**
	 * @return
	 */
	public String getNewEndTime() {
		return newEndTime;
	}

	/**
	 * @param string
	 */
	public void setNewEndTime(String string) {
		newEndTime = string;
	}


	
	

	public Date getNewStartDate() {
		return newStartDate;
	}

	public void setNewStartDate(Date newStartDate) {
		this.newStartDate = newStartDate;
	}

	public Date getNewEndDate() {
		return newEndDate;
	}

	public void setNewEndDate(Date newEndDate) {
		this.newEndDate = newEndDate;
	}

	/**
	 * @return
	 */
	public String getNewStartTime() {
		return newStartTime;
	}

	

	/**
	 * @param string
	 */
	public void setNewStartTime(String string) {
		newStartTime = string;
	}

	/**
	 * @return
	 */
//	public AgentDayBean getLastShift() {
//		return lastShift;
//	} to delete

	/**
	 * @return
	 */
//	public AgentDayBean getNextShift() {
//		return nextShift;
//	} to delete

	/**
	 * @return
	 */
//	public String getUserForUpdate() {
//		return userForUpdate;
//	} to delete

	/**
	 * @param bean
	 */
//	public void setLastShift(AgentDayBean bean) {
//		lastShift = bean;
//	} to delete

	/**
	 * @param bean
	 */
//	public void setNextShift(AgentDayBean bean) {
//		nextShift = bean;
//	} to delete

	/**
	 * @param string
	 */
//	public void setUserForUpdate(String string) {
//		userForUpdate = string;
//	} to delete

	/** 
	 * @return
	 */
	public String getNewEndStatusForUpdate() {
		return newEndStatusForUpdate;
	}

	/**
	 * @return
	 */
	public String getNewStartStatusForUpdate() {
		return newStartStatusForUpdate;
	}

	/**
	 * @param string
	 */
	public void setNewEndStatusForUpdate(String string) {
		newEndStatusForUpdate = string;
	}

	/**
	 * @param string
	 */
	public void setNewStartStatusForUpdate(String string) {
		newStartStatusForUpdate = string;
	}

	

	/**
	 * @return
	 */
	public String getMokedForCheck() {
		return mokedForCheck;
	}

	/**
	 * @param string
	 */
	public void setMokedForCheck(String string) {
		mokedForCheck = string;
	}

	/**
	 * @param bean
	 */
	public void setTree(ShiftTreeNodeBean bean) {
		tree = bean;
	}

	/**
	 * @return
	 */
	public ShiftTreeNodeBean getTree() {
		return tree;
	}

	public boolean isCancelBreakSwitch() {
		return cancelBreakSwitch;
	}

	public void setCancelBreakSwitch(boolean cancelBreakSwitch) {
		this.cancelBreakSwitch = cancelBreakSwitch;
	}

	public Vector<bzq.shf.forms.OrgUnitTableForm> getMyAgafMokedUnits() {
		return myAgafMokedUnits;
	}

	public void setMyAgafMokedUnits(
			Vector<bzq.shf.forms.OrgUnitTableForm> myAgafMokedUnits) {
		this.myAgafMokedUnits = myAgafMokedUnits;
	}

	public boolean isSwitchPotential() {
		return isSwitchPotential;
	}

	public void setSwitchPotential(boolean isSwitchPotential) {
		this.isSwitchPotential = isSwitchPotential;
	}

	public FormFile getShiftsFile() {
		return shiftsFile;
	}

	public void setShiftsFile(FormFile shiftsFile) {
		this.shiftsFile = shiftsFile;
	}

	public String getShiftLocation() {
		return shiftLocation;
	}

	public void setShiftLocation(String shiftLocation) {
		this.shiftLocation = shiftLocation;
	}

	public String getNewSplitStartTime() {
		return newSplitStartTime;
	}

	public void setNewSplitStartTime(String newSplitStartTime) {
		this.newSplitStartTime = newSplitStartTime;
	}

	public String getNewSplitEndTime() {
		return newSplitEndTime;
	}

	public void setNewSplitEndTime(String newSplitEndTime) {
		this.newSplitEndTime = newSplitEndTime;
	}

	public String getShiftExtNum() {
		return shiftExtNum;
	}

	public void setShiftExtNum(String shiftExtNum) {
		this.shiftExtNum = shiftExtNum;
	}


}
