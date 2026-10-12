/*
 * Created on 09/02/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.taglib;

import java.util.Vector;

import javax.servlet.jsp.JspException;

import org.apache.struts.util.ResponseUtils;

import bzq.shf.utils.SHFTableUtils;
import bzq.taglib.BaseHandlerTag;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class ExceptionCheckBoxSelectTag extends BaseHandlerTag{
	
	private String site;
	private String selectedException;
	private String name;
	private String cbDisabled;
	
	public int doStartTag() throws JspException {
		Vector excVec = SHFTableUtils.getExceptionsForSite(site);
		StringBuffer buffer = new StringBuffer();
		buffer.append("<table width=100% dir=rtl >");
		buffer.append(" <FIELDSET class=info> ");
		buffer.append("<LEGEND>פעילויות מיוחדות</LEGEND>");
			int ll = excVec.size();
			for (int g=1; g<=ll; g++) {
				bzq.shf.bean.ExceptionActivityBean excT = (bzq.shf.bean.ExceptionActivityBean) excVec.get(g-1);
				if (g-1%5 == 0) {buffer.append("<tr> \n");}
				buffer.append("<TD> \n"); 
					String checked = checkIsSelected(selectedException, excT.getCode())?" checked=checked ":" ";
					String disable = (cbDisabled.equals("dis"))?" disabled=disabled ":" ";
					buffer.append("<INPUT id=check" + g +" name="+name+" type=checkbox value="+ excT.getCode()+ checked + " " + disable +" > " + excT.getDescription() +" \n") ;
				buffer.append("</TD> \n");
		     if (g%5 == 0) { buffer.append("</tr> \n");}
			 }
		buffer.append("</FIELDSET>");	 
		buffer.append("</table>");


		ResponseUtils.write(pageContext, buffer.toString());
		return (SKIP_BODY);	
			
		}
	private boolean checkIsSelected(String selectedExceptions,String code) {
		boolean retValue=false;
	
		if (selectedExceptions == null) return retValue;
		java.util.StringTokenizer st = new java.util.StringTokenizer(selectedExceptions,";");
		while (st.hasMoreTokens()) {
			if (st.nextToken().equals(code)) retValue=true;
		}
		return retValue;
	}
		
	
	/**
	 * @return
	 */
	public String getSite() {
		return site;
	}

	/**
	 * @param string
	 */
	public void setSite(String string) {
		site = string;
	}

	/**
	 * @return
	 */
	public String getSelectedException() {
		return selectedException;
	}

	/**
	 * @param string
	 */
	public void setSelectedException(String string) {
		selectedException = string;
	}

	/**
	 * @return
	 */
	public String getName() {
		return name;
	}

	/**
	 * @param string
	 */
	public void setName(String string) {
		name = string;
	}

	
	/**
	 * @return
	 */
	public String getCbDisabled() {
		return cbDisabled;
	}

	/**
	 * @param string
	 */
	public void setCbDisabled(String string) {
		cbDisabled = string;
	}

}
