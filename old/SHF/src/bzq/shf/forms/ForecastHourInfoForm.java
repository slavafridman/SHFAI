/*
 * Created on 02/04/2009
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
public class ForecastHourInfoForm extends ShfBaseBean{
	
	protected String hour;
	protected int frcCalls;
	protected int perfCalls;
	protected double frcHandleAvg;
	protected double perfHandleAvg;
	
	protected boolean hasData=false;
	
	protected int agentsPlanned;
	protected int agentsScheduled;
	protected int agentsUpdated;
	protected int agentsMissing;
	protected int agentsLate;
	protected int agentsArriving;
	protected int agentsLeaving;

	public ForecastHourInfoForm(){
		
	}
	
	public HashMap getFieldsMapping() {
		return null;
	}
	
	public double getDeviation(){
		if(perfCalls>0){
			return frcCalls/perfCalls;
		}
		return -1;
	}
	
	

	/**
	 * @return
	 */
	public int getAgentsArriving() {
		return agentsArriving;
	}

	/**
	 * @return
	 */
	public int getAgentsLate() {
		return agentsLate;
	}

	/**
	 * @return
	 */
	public int getAgentsLeaving() {
		return agentsLeaving;
	}

	/**
	 * @return
	 */
	public int getAgentsMissing() {
		return agentsMissing;
	}

	/**
	 * @return
	 */
	public int getAgentsPlanned() {
		return agentsPlanned;
	}

	/**
	 * @return
	 */
	public int getAgentsScheduled() {
		return agentsScheduled;
	}

	/**
	 * @return
	 */
	public int getAgentsUpdated() {
		return agentsUpdated;
	}

	

	/**
	 * @return
	 */
	public int getFrcCalls() {
		return frcCalls;
	}

	/**
	 * @return
	 */
	public String getHour() {
		return hour;
	}

	
	/**
	 * @return
	 */
	public int getPerfCalls() {
		return perfCalls;
	}

	/**
	 * @param i
	 */
	public void setAgentsArriving(int i) {
		agentsArriving = i;
	}

	/**
	 * @param i
	 */
	public void setAgentsLate(int i) {
		agentsLate = i;
	}

	/**
	 * @param i
	 */
	public void setAgentsLeaving(int i) {
		agentsLeaving = i;
	}

	/**
	 * @param i
	 */
	public void setAgentsMissing(int i) {
		agentsMissing = i;
	}

	/**
	 * @param i
	 */
	public void setAgentsPlanned(int i) {
		agentsPlanned = i;
	}

	/**
	 * @param i
	 */
	public void setAgentsScheduled(int i) {
		agentsScheduled = i;
	}

	/**
	 * @param i
	 */
	public void setAgentsUpdated(int i) {
		agentsUpdated = i;
	}

	
	/**
	 * @param i
	 */
	public void setFrcCalls(int i) {
		frcCalls = i;
	}

	/**
	 * @param string
	 */
	public void setHour(String string) {
		hour = string;
	}

	/**
	 * @param i
	 */
	public void setPerfCalls(int i) {
		perfCalls = i;
	}
	
	

	/**
	 * @return
	 */
	public double getFrcHandleAvg() {
		return frcHandleAvg;
	}

	/**
	 * @return
	 */
	public double getPerfHandleAvg() {
		return perfHandleAvg;
	}

	/**
	 * @param i
	 */
	public void setFrcHandleAvg(double i) {
		frcHandleAvg = i;
	}

	/**
	 * @param i
	 */
	public void setPerfHandleAvg(double i) {
		perfHandleAvg = i;
	}

	/**
	 * @return
	 */
	public boolean isHasData() {
		return hasData;
	}

	/**
	 * @param b
	 */
	public void setHasData(boolean b) {
		hasData = b;
	}

}
