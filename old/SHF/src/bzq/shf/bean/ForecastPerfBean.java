/*
 * Created on 29/03/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.bean;

import java.util.Date;
import java.util.HashMap;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class ForecastPerfBean extends ShfBaseBean{
	protected static HashMap fieldsMapping = null;
	static {
		fieldsMapping = new HashMap();
		fieldsMapping.put("WM_PERIOD_START", "periodStart");
		fieldsMapping.put("WM_ABAND_CALLS", "abandCalls");
		fieldsMapping.put("WM_ACTIVITY_ID", "activityId");
		fieldsMapping.put("WM_AGENTS_IN", "agentsIn");
		fieldsMapping.put("WM_AGENT_MINUTES", "agentMinutes");
		fieldsMapping.put("WM_ASA", "asa");
		fieldsMapping.put("WM_CALLVOL", "callvol");
		fieldsMapping.put("WM_DISTRIB_CALLS", "distribCalls");
		fieldsMapping.put("WM_HANDLED_CALLS", "handledCalls");
		fieldsMapping.put("WM_HANDLE_TIME", "handleTime");
		fieldsMapping.put("WM_SERV_FACTOR", "servFactor");
		fieldsMapping.put("WM_VIRTUAL_ACTIVITY_ID", "virtualActivity");
	}
	
	protected Date periodStart;
	protected int abandCalls;
	protected int activityId;
	protected int agentsIn;
	protected int agentMinutes;
	protected int asa;
	protected int callvol;
	protected int distribCalls;
	protected int handledCalls;
	protected double handleTime;
	protected int servFactor;
	protected int virtualActivity;
	 
	 
	public HashMap getFieldsMapping() {
		return fieldsMapping;
	}
	
	
	/**
	 * @return
	 */
	public int getAbandCalls() {
		return abandCalls;
	}

	/**
	 * @return
	 */
	public int getActivityId() {
		return activityId;
	}

	/**
	 * @return
	 */
	public int getAgentMinutes() {
		return agentMinutes;
	}

	/**
	 * @return
	 */
	public int getAgentsIn() {
		return agentsIn;
	}

	/**
	 * @return
	 */
	public int getAsa() {
		return asa;
	}

	/**
	 * @return
	 */
	public int getCallvol() {
		return callvol;
	}

	/**
	 * @return
	 */
	public int getDistribCalls() {
		return distribCalls;
	}

	/**
	 * @return
	 */
	public int getHandledCalls() {
		return handledCalls;
	}

	/**
	 * @return
	 */
	public double getHandleTime() {
		return handleTime;
	}

	/**
	 * @return
	 */
	public Date getPeriodStart() {
		return periodStart;
	}

	/**
	 * @return
	 */
	public int getServFactor() {
		return servFactor;
	}

	/**
	 * @return
	 */
	public int getVirtualActivity() {
		return virtualActivity;
	}

	/**
	 * @param map
	 */
	public static void setFieldsMapping(HashMap map) {
		fieldsMapping = map;
	}

	/**
	 * @param i
	 */
	public void setAbandCalls(int i) {
		abandCalls = i;
	}

	/**
	 * @param i
	 */
	public void setActivityId(int i) {
		activityId = i;
	}

	/**
	 * @param i
	 */
	public void setAgentMinutes(int i) {
		agentMinutes = i;
	}

	/**
	 * @param i
	 */
	public void setAgentsIn(int i) {
		agentsIn = i;
	}

	/**
	 * @param i
	 */
	public void setAsa(int i) {
		asa = i;
	}

	/**
	 * @param i
	 */
	public void setCallvol(int i) {
		callvol = i;
	}

	/**
	 * @param i
	 */
	public void setDistribCalls(int i) {
		distribCalls = i;
	}

	/**
	 * @param i
	 */
	public void setHandledCalls(int i) {
		handledCalls = i;
	}

	/**
	 * @param i
	 */
	public void setHandleTime(double i) {
		handleTime = i;
	}

	/**
	 * @param i
	 */
	public void setPeriodStart(Date i) {
		periodStart = i;
	}

	/**
	 * @param i
	 */
	public void setServFactor(int i) {
		servFactor = i;
	}

	/**
	 * @param i
	 */
	public void setVirtualActivity(int i) {
		virtualActivity = i;
	}

}
