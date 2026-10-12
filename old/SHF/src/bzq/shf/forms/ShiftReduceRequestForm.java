/*
 * Created on 13/07/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.forms;

import java.util.Date;
import java.util.Vector;

import bzq.shf.bean.AgentDayBean;
import bzq.shf.bean.EmployeeBean;
import bzq.shf.bean.ReduceRequestBean;


/**
 * @author 02964437
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class ShiftReduceRequestForm extends ReduceRequestBean{
	
	public ShiftReduceRequestForm() {
		super();
	}
	
	protected Date date;
	protected String time;
	protected ShiftReduceListForm[] reduceList = null;
	protected EmployeeBean[] empList = null;
	protected AgentDayBean[] agentDayList = null;
	protected String sourceWindow = null;
	protected int sumApproved;
	/**
	 * @return
	 */
	public Date getDate() {
		return date;
	}

	/**
	 * @return
	 */
	public String getTime() {
		return time;
	}

	/**
	 * @param string
	 */
	public void setDate(Date d) {
		date = d;
	}

	/**
	 * @param string
	 */
	public void setTime(String string) {
		time = string;
	}

	/**
	 * @return
	 */
	public ShiftReduceListForm[] getReduceList() {
		return reduceList;
	}

	/**
	 * @param forms
	 */
	public void setReduceList(ShiftReduceListForm[] forms) {
		reduceList = forms;
	}

	/**
	 * @return
	 */
	public EmployeeBean[] getEmpList() {
		return empList;
	}

	/**
	 * @param beans
	 */
	public void setEmpList(EmployeeBean[] beans) {
		empList = beans;
	}

	/**
	 * @return
	 */
	public String getSourceWindow() {
		return sourceWindow;
	}

	/**
	 * @param string
	 */
	public void setSourceWindow(String string) {
		sourceWindow = string;
	}

	/**
	 * @return
	 */
	public AgentDayBean[] getAgentDayList() {
		return agentDayList;
	}

	/**
	 * @param beans
	 */
	public void setAgentDayList(AgentDayBean[] beans) {
		agentDayList = beans;
	}

	/**
	 * @return
	 */
	public int getSumApproved() {
		return sumApproved;
	}

	/**
	 * @param i
	 */
	public void setSumApproved(int i) {
		sumApproved = i;
	}

}
