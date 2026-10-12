/*
 * Created on 05/04/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.forms;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class ForecastExceptinResultForm extends ForecastForm{

	protected int agentsCalling;
	protected int agentsInBreak;
	protected int agentsInExceptionSelected;
	protected int agentsInAllExceptins;
	
	public ForecastExceptinResultForm(){
		
	}
	
	
	

	/**
	 * @return
	 */
	public int getAgentsCalling() {
		return agentsCalling;
	}

	/**
	 * @return
	 */
	public int getAgentsInAllExceptins() {
		return agentsInAllExceptins;
	}

	/**
	 * @return
	 */
	public int getAgentsInBreak() {
		return agentsInBreak;
	}

	/**
	 * @return
	 */
	public int getAgentsInExceptionSelected() {
		return agentsInExceptionSelected;
	}

	/**
	 * @param i
	 */
	public void setAgentsCalling(int i) {
		agentsCalling = i;
	}

	/**
	 * @param i
	 */
	public void setAgentsInAllExceptins(int i) {
		agentsInAllExceptins = i;
	}

	/**
	 * @param i
	 */
	public void setAgentsInBreak(int i) {
		agentsInBreak = i;
	}

	/**
	 * @param i
	 */
	public void setAgentsInExceptionSelected(int i) {
		agentsInExceptionSelected = i;
	}

}
