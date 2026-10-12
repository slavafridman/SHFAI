/*
 * Created on 17/01/2010
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.batch.beans;

import bzq.shf.batch.ShfBatchConstants;
import bzq.utils.BaseConvert;



/**
 * @author 02964437
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class SapCompletionLineBean {
	
	private CtiCompletionBean compBean;
	private String recType;
	
	public SapCompletionLineBean(CtiCompletionBean compBean, String recType){
		this.compBean = compBean;
		this.recType = recType;
		
	}

	public String toString(){
		String str=null; 
		if (recType.equals(ShfBatchConstants.Sap_Line_OUT)) {
			
			str = ShfBatchConstants.Sap_8spaces + compBean.getEmpId();
			str = str + BaseConvert.dateToString(compBean.getCopmletionEnd(), "yyyyMMdd") + BaseConvert.dateToString(compBean.getCopmletionEnd(), "HHmmss");
			//Yuval - 17082011 
			//make second = zero
			//29.01.12 - rollback
			//str = str + "00";
			str = str + BaseConvert.dateToString(compBean.getCopmletionEnd(), "yyyyMMdd") + BaseConvert.dateToString(compBean.getCopmletionEnd(), "HHmmss");
			//str = str + "00";
			str = str + ShfBatchConstants.Sap_Line_OUT + ShfBatchConstants.Sap_ClockNumber + ShfBatchConstants.Sap_4spaces;
			
		}else if (recType.equals(ShfBatchConstants.Sap_Line_IN)) {
			str = ShfBatchConstants.Sap_8spaces + compBean.getEmpId();
			str = str + BaseConvert.dateToString(compBean.getCopmletionStart(), "yyyyMMdd") + BaseConvert.dateToString(compBean.getCopmletionStart(), "HHmmss");
			//Yuval - 17082011 
			//make second = zero
			//29.01.12 - rollback
			//str = str + "00";
			str = str + BaseConvert.dateToString(compBean.getCopmletionStart(), "yyyyMMdd") + BaseConvert.dateToString(compBean.getCopmletionStart(), "HHmmss");	
			//str = str + "00";
			str = str + ShfBatchConstants.Sap_Line_IN + ShfBatchConstants.Sap_ClockNumber + ShfBatchConstants.Sap_4spaces;
		}
				
		return str;
	}

}
