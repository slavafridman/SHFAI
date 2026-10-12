/*
 * Created on 25/12/2008
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.forms;

import java.util.HashMap;

import bzq.shf.bean.ShfBaseBean;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class AddShiftForm extends ShfBaseBean{

	protected String date;
	protected String shiftStart;
	protected String shiftEnd;
	protected String activity;
	protected String remark;
	protected String[] breakStart;
	protected String[] breakEnd;
	protected int breaksNumber;
	protected int employeeId;
	protected String idNumber;
	protected String fullIdNumber;
	protected String moked;
	protected String[] breakPotentialAll;
	protected String[] shiftLocationAll;
	protected int[] employeeIdPotentialAll;
	protected String[] idNumberPotentialAll;
	protected boolean send = true;
	protected String shiftLocation;
	protected boolean shiftSplit;
	protected String shiftSplitStart;
	protected String shiftSplitEnd;
	
	public int[] getEmployeeIdPotentialAll() {
		return employeeIdPotentialAll;
	}




	public void setEmployeeIdPotentialAll(int[] employeeIdPotentialAll) {
		this.employeeIdPotentialAll = employeeIdPotentialAll;
	}




	public String[] getIdNumberPotentialAll() {
		return idNumberPotentialAll;
	}




	public void setIdNumberPotentialAll(String[] idNumberPotentialAll) {
		this.idNumberPotentialAll = idNumberPotentialAll;
	}




	public String[] getBreakPotentialAll() {
		return breakPotentialAll;
	}




	public void setBreakPotentialAll(String[] breakPotentialAll) {
		this.breakPotentialAll = breakPotentialAll;
	}




	public String[] getShiftLocationAll() {
		return shiftLocationAll;
	}




	public void setShiftLocationAll(String[] shiftLocationAll) {
		this.shiftLocationAll = shiftLocationAll;
	}




	public String[] getBreakEnd() {
		return breakEnd;
	}




	public String getIdNumber() {
		return idNumber;
	}




	public void setIdNumber(String idNumber) {
		this.idNumber = idNumber;
	}




	public String getFullIdNumber() {
		return fullIdNumber;
	}




	public void setFullIdNumber(String fullIdNumber) {
		this.fullIdNumber = fullIdNumber;
	}




	public int getBreaksNumber() {
		return breaksNumber;
	}




	public void setBreaksNumber(int breaksNumber) {
		this.breaksNumber = breaksNumber;
	}




	public void setBreakEnd(String[] breakEnd) {
		this.breakEnd = breakEnd;
	}




	public String getDate() {
		return date;
	}




	public String getMoked() {
		return moked;
	}




	public void setMoked(String moked) {
		this.moked = moked;
	}




	public void setDate(String date) {
		this.date = date;
	}




	public String getShiftStart() {
		return shiftStart;
	}




	public void setShiftStart(String shiftstart) {
		this.shiftStart = shiftstart;
	}




	public String getShiftEnd() {
		return shiftEnd;
	}




	public void setShiftEnd(String shiftEnd) {
		this.shiftEnd = shiftEnd;
	}




	public String getActivity() {
		return activity;
	}




	public void setActivity(String activity) {
		this.activity = activity;
	}




	public String getRemark() {
		return remark;
	}




	public void setRemark(String remark) {
		this.remark = remark;
	}




	public String[] getBreakStart() {
		return breakStart;
	}




	public void setBreakStart(String[] breakStart) {
		this.breakStart = breakStart;
	}



	public int getEmployeeId() {
		return employeeId;
	}




	public void setEmployeeId(int employeeId) {
		this.employeeId = employeeId;
	}




	public boolean isSend() {
		return send;
	}




	public void setSend(boolean send) {
		this.send = send;
	}




	@Override
	public HashMap getFieldsMapping() {
		// TODO Auto-generated method stub
		return null;
	}




	public String getShiftLocation() {
		return shiftLocation;
	}




	public void setShiftLocation(String shiftLocation) {
		this.shiftLocation = shiftLocation;
	}





	public boolean isShiftSplit() {
		return shiftSplit;
	}




	public void setShiftSplit(boolean shiftSplit) {
		this.shiftSplit = shiftSplit;
	}




	public String getShiftSplitStart() {
		return shiftSplitStart;
	}




	public void setShiftSplitStart(String shiftSplitStart) {
		this.shiftSplitStart = shiftSplitStart;
	}




	public String getShiftSplitEnd() {
		return shiftSplitEnd;
	}




	public void setShiftSplitEnd(String shiftSplitEnd) {
		this.shiftSplitEnd = shiftSplitEnd;
	}
	
	
}
